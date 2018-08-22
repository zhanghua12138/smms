//1.引入mysql模块(需要下载mysql__npm i mysql)
var mysql=require('mysql');
/*2.连接数据库的配置*/
var mysqlConn = mysql.createConnection({
    host     : 'localhost', //主机名称
    user     : 'root', //用户名
    password : 'root', //密码
    database : 'lushi' //数据库的名称
});
//3. 打开数据库连接
mysqlConn.connect();
/*4. 使用打开的连接执行增删改查
mysqlConn.query('Select/Delete/Insert/Update', function (error, results, fields) {
  if (error) throw error; //抛出错误
  console.log('The results: ', results);  //返回的结果
})*/
module.exports = mysqlConn;