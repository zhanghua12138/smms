var express = require('express');
var router = express.Router();
var mysqlConn = require('./mysqlConn');
//添加用户信息
router.post('/add', function(req, res, next) {
    /*1.接收数据*/
    var cateID=req.body.cateID;
    var barcode=req.body.barcode;
    var goodsname=req.body.goodsname;
    var goodsprice=parseFloat(req.body.goodsprice);
    var Promotion=req.body.promotion;
    var marketprice=parseFloat(req.body.marketprice);
    var saleprice=parseFloat(req.body.saleprice);
    var stockNum=parseInt(req.body.stockNum);
    var weigth=parseFloat(req.body.weigth);
    var unit=req.body.unit;
    var discount=req.body.discount;
    var goodsDetails=req.body.goodsDetails;
    //2. 构造sql语句
    //为了防止SQL注入，字段的值可以使用?作为占位符，mysql模块会自动过滤敏感关键词
    //username,password,realname,usergroup 字段名称一定要与数据库对应
    var sqlStr=`insert into goods(cateID,barcode,goodsname,goodsprice,Promotion,marketprice,saleprice,stockNum,weigth,unit,discount,goodsDetails) values(?,?,?,?,?,?,?,?,?,?,?,?)`;
    var sqlParams=[cateID,barcode,goodsname,goodsprice,Promotion,marketprice,saleprice,stockNum,weigth,unit,discount,goodsDetails];
    //3. 执行sql语句
    mysqlConn.query(sqlStr,sqlParams, function (error, results, fields) {
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
    var currentPage = parseInt(req.query.currentPage);
    var pagesize = parseInt(req.query.pagesize);
    var keywords = req.query.keywords;
    var cateName = req.query.cateName;
    // console.log(keywords,cateName);
    //第一次查询得到所有数据的总数
    var sql ="select * from goods where 1=1";
    mysqlConn.query(sql, function (error, resultAll, fields) {
        if (error) throw error; //抛出错误
        //查询成功返回结果
        var total= resultAll.length;//把总数缓存起来
        if(cateName.length>0){
            sql+=` and cateID='${cateName}'`;
            // console.log(sql)
        };
        if (keywords.length>0){
            sql+=` and (goodsname like '%${keywords}%' or barcode like '%${cateName}%')`;
        };
        //order 排序
        sql+=' order by id DESC';
        //条件查询以后数据总数发生了变化,需要对总数重新赋值
        if(keywords.length>0 || cateName.length>0){
            mysqlConn.query(sql,function (error, resultSearch) {
                if (error) throw error;
                total=resultSearch.length;//重置搜索的总记录数
            });
        }
        sql+=" limit ?,?";//修改sql语句,查询当前页面需要显示的数据
        //翻页时,需要跳过(currentPage-1)*pagesize条数据,限制pagesize数据
        var sqlproms= [(currentPage-1)*pagesize,pagesize];
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
        })
    })
});
//删除功能
router.get('/del',function (req,res,next) {
    var _id = req.query.id;
    var sql =`delete from goods where id=${_id}`;
    mysqlConn.query(sql,_id,function (error, userData, fields) {
        if (error) throw error; //抛出错误
        if(userData.affectedRows>0){
            res.send({success:1,message:"删除成功"});
        }else{
            res.send({success:0,message:"删除失败"});
        }
    });

});
//跳转到编辑页面
var edit_id;
router.get('/toedit',function (req,res,next) {
    edit_id = req.query.id;
    console.log(edit_id);
    res.send(true);
});
//回填页面
router.get('/edit',function (req,res,next) {
    var _id = edit_id;
    var sql = "select * from goods where id=?";
    mysqlConn.query(sql,_id,function (error, userData, fields) {
        if (error) throw error; //抛出错误
        res.send(userData[0]);
    });
});

//修改保存
router.post('/write',function (req,res,next) {
    var cateID=req.body.cateID;
    var barcode=req.body.barcode;
    var goodsname=req.body.goodsname;
    var goodsprice=parseFloat(req.body.goodsprice);
    var Promotion=req.body.promotion;
    var marketprice=parseFloat(req.body.marketprice);
    var saleprice=parseFloat(req.body.saleprice);
    var stockNum=parseInt(req.body.stockNum);
    var weigth=parseFloat(req.body.weigth);
    var unit=req.body.unit;
    var discount=req.body.discount;
    var goodsDetails=req.body.goodsDetails;
    var sql = `update goods set cateID=?,barcode=?,goodsname=?,goodsprice=?,Promotion=?,marketprice=?,saleprice=?,stockNum=?,weigth=?,unit=?,discount=?,goodsDetails=? where id=${edit_id}`;
    var sqlParams=[cateID,barcode,goodsname,goodsprice,Promotion,marketprice,saleprice,stockNum,weigth,unit,discount,goodsDetails];
    console.log(sqlParams)
    mysqlConn.query(sql,sqlParams,function (error, userData, fields) {
        if (error) throw error; //抛出错误
        if(userData.affectedRows>0){
            res.send({success:1,message:"修改成功"});
        }else{
            res.send({success:0,message:"修改失败"});
        };
    });
});
//批量删除
router.get("/delSelect",function (req, res) {
    var needID = req.query.needID;
    var sql = "delete from goods where id in("+needID+")";
    mysqlConn.query(sql,function (error, userData, fields) {
        if (error) throw error; //抛出错误
        if (userData.affectedRows>0){
            res.send({isSuccess:1,msg:"批量删除成功！"});
        }else{
            res.send({isSuccess:0,msg:"批量删除失败！"});
        };
    });
});
module.exports = router;
