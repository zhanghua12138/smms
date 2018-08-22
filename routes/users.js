var express = require('express');
var router = express.Router();
//引入外部封装的mysql连接模块
var mysqlConn = require('./mysqlConn');
//引入加密模块crypto
const crypto = require('crypto');
//添加用户信息
router.post('/add', function(req, res, next) {
    /*1.接收数据*/
    var username = req.body.username;
    var password = crypto.createHash('md5').update(req.body.password).digest('hex');
    var realname = req.body.realname;
    var usergroup = req.body.usergroup;
    var sqlParams=[username,password,realname,usergroup];
    //2. 构造sql语句
    //为了防止SQL注入，字段的值可以使用?作为占位符，mysql模块会自动过滤敏感关键词
    //username,password,realname,usergroup 字段名称一定要与数据库对应
    var sql = "insert into userinfo(username,password,realname,usergroup) values(?,?,?,?)";
    //3. 执行sql语句
    mysqlConn.query(sql,sqlParams, function (error, results, fields) {
        if (error) throw error; //抛出错误
        /*
        执行成功返回一个对象
        OkPacket {
                fieldCount: 0,
                affectedRows: 1, //受影响的行数的值如果是大于0的就表示执行成功
                insertId: 1,
                serverStatus: 2,
                warningCount: 0,
                message: '',
                protocol41: true,
                changedRows: 0
        }
        */
        //4. 返回结果到前端
        if(results.affectedRows>0){
          res.send({success:1,message:"添加成功"});
        }else{
            res.send({success:0,message:"添加失败"});
        }
    })
});
//查询用户信息
router.get('/list',function (req,res,next) {
    //接受页码和每页数据大小(需要转成整数)
    var currentPage = parseInt(req.query.currentPage);//页数
    var pagesize = parseInt(req.query.pagesize);//每页大小
    // console.log("页数:",currentPage,"每页大小",pagesize);
    //翻页时,需要跳过(currentPage-1)*pagesize条数据,限制pagesize数据
    var sqlproms= [(currentPage-1)*pagesize,pagesize];
    //第一次查询得到所有数据的总数
    var sql ="select * from userinfo order by id DESC";
    mysqlConn.query(sql, function (error, resultAll, fields) {
        if (error) throw error; //抛出错误
        //查询成功返回结果
        var total= resultAll.length;//把总数缓存起来
        sql+=" limit ?,?";//修改sql语句,查询当前页面需要显示的数据
        mysqlConn.query(sql,sqlproms, function (error, userData, fields) {
            if (error) throw error; //抛出错误
            //查询成功返回结果(包括之前的总数和查询到的数据)
            if(userData.length>0){
                var result = {
                    total:total,
                    userData:userData
                };
                res.send(result);
            }else{
                sqlproms= [(currentPage-2)*pagesize,pagesize];
                mysqlConn.query(sql,sqlproms, function (error, userData, fields){
                    var result = {
                        total:total,
                        userData:userData
                    };
                    res.send(result);
                })
            }
            // console.log(result.userData.length);

        })
    })
});
//删除功能
router.get('/del',function (req,res,next) {
    var _id = req.query.id;
    var sql ="delete from userinfo where id=?;"
    mysqlConn.query(sql,_id,function (error, userData, fields) {
        if (error) throw error; //抛出错误
        if(userData.affectedRows>0){
            res.send({success:1,message:"删除成功"});
        }else{
            res.send({success:0,message:"删除失败"});
        }
    });

});
var edit_id;
router.get('/toedit',function (req,res,next) {
    edit_id = req.query.id;
    console.log(edit_id);
    res.send(true);
});
//跳转到编辑页面并且数据回填
router.get('/edit',function (req,res,next) {
    var _id = edit_id;
    var sql = "select * from userinfo where id=?";
    mysqlConn.query(sql,_id,function (error, userData, fields) {
        if (error) throw error; //抛出错误
        var result = {
            username:userData[0].username,
            realname:userData[0].realname,
            userlist:userData[0].usergroup
        };
        res.send(result);
    });
});
router.post('/write',function (req,res,next) {
    var username = req.body.username;
    var password = crypto.createHash('md5').update(req.body.password).digest('hex');
    var realname = req.body.realname;
    var usergroup = req.body.usergroup;
    var _id = edit_id;
    var sql = `update userinfo set username=?,password=?,realname=?,usergroup=? where id=${_id}`;
    var sqlParams=[username,password,realname,usergroup];
    mysqlConn.query(sql,sqlParams,function (error, userData, fields) {
        if (error) throw error; //抛出错误
        if(userData.affectedRows>0){
            res.send({success:1,message:"修改成功"});
        }else{
            res.send({success:0,message:"修改失败"});
        };
    });
});
//验证登录
router.post("/checkLagin",function (req, res, next) {
    var username = req.body.username;
    var password = crypto.createHash('md5').update(req.body.password).digest('hex');
    var sql = "select * from userinfo where username=? and password=?";
    var sqlParams = [username,password];
    mysqlConn.query(sql,sqlParams,function (error, userData, fields){
        if (error) throw error; //抛出错误
        if (userData.length>0){
            //缓存cookie
            res.cookie("username",userData[0].username);
            res.cookie("userId",userData[0].id);
            res.cookie("usergroup",userData[0].usergroup);
            res.cookie("realname",userData[0].realname);
            //返回查询结果
            res.send({isSuccess:1,msg:"登录成功！"});
        }else{
            res.send({isSuccess:0,msg:"登录失败！"});
        };
    });
});
//判断是否已经登录(查看cookie是否存在,不存在就回到登录页面)
router.get("/checkIsLogin",function (req, res, next) {
    //得到cookie,用于判断登录状态
    var username=req.cookies.username;
    if (username){
        if (username.length>0){
            res.send('console.log("ok");');
        }
        else{
            res.send('location.href="login.html"');
        }
    }else{
        res.send('location.href="login.html"');
    }
});
//退出登录
router.get("/outLogin",function (req, res, next) {
    //清空
    res.clearCookie("username");
    res.clearCookie("userId");
    res.clearCookie("usergroup");
    res.clearCookie("realname");
    res.redirect("/login.html");
});
//获取登录人的真实姓名,以作欢迎谁的提示
router.get("/getRealname",function (req, res) {
    var realname = req.cookies.realname;
    var username = req.cookies.username;
    var userId = req.cookies.userId;
    var usergroup = req.cookies.usergroup;
    res.send({realname,username,userId,usergroup});
});
//删除选中
router.get("/delSelect",function (req, res) {
    var needID = req.query.needID;
    var sql = "delete from userinfo where id in("+needID+")";
    mysqlConn.query(sql,function (error, userData, fields) {
        if (error) throw error; //抛出错误
        if (userData.affectedRows>0){
            res.send({isSuccess:1,msg:"批量删除成功！"});
        }else{
            res.send({isSuccess:0,msg:"批量删除失败！"});
        };
    });
});
router.post("/editPass",function (req, res) {
    var oldpassword = crypto.createHash('md5').update(req.body.password).digest('hex');
    var newPass = crypto.createHash('md5').update(req.body.newpass).digest('hex');
    // console.log(oldpassword,newPass);
    var _id = req.cookies.userId;
    var sql = `select password from userinfo where id=${_id}`;
    mysqlConn.query(sql,function (error, userData, fields) {
        if (error) throw error; //抛出错误
        // console.log(userData[0].password);
        if(oldpassword==userData[0].password){
            var sql2 = `update userinfo set password='${newPass}' where id=${_id}`;
            console.log(sql2);
            mysqlConn.query(sql2,function (error, result) {
                if (error) throw error;
                if (result.affectedRows>0){
                    res.send({isSucess:1,msg:"原密码正确,修改成功"});
                }else{
                    res.send({isSucess:0,msg:"原密码正确,不可预知的错误导致删除失败,请重试"});
                }
            })
        }else{
            res.send({isSucess:0,msg:"原密码不正确"})
        }
    });
})
module.exports = router;
