# 自动检测app状态(check your app status on the store)
> 主要用于检测app的下架状态，如果下架可以进行下一步操作，仅仅使用了简单的文件作为数据库
> watch your app status:online or be removed,just use json file to be database

## install dependencies
> npm install

if you didn't install nodemon and pm2 ,please install it on global

> npm i nodemon pm2 -g

> Please create the JSON file  on /src/db ,named DATA.json,content is like exmaple.json

## run the app on develop
> npm run dev

## run the app on production 
> npm start

## run the app production and backend
> pm2 start

## deploy the app by docker
run the app root folder
+ sudo docker build -t auto_checker .

+ sudo  docker run -p 8085:3000 -d --restart=always  auto_checker

# 对接飞书消息机器人发送通知
> 详见[飞书文档](https://getfeishu.cn/hc/zh-cn/articles/360024984973)

# API Document
## 获取app列表(get app list)

| KEY    | VALUE  | DESC                                                         |
| ------ | ------ | ------------------------------------------------------------ |
| 路由(router) | /list  |                                                              |
| 方法(method) | get    |                                                              |
| 参数(params) | status | status==undefined:get all,status==0:get offline list;status==1 get online list |

---
## 新增一个app(add one to app list)

| KEY    | VALUE  | DESC                                                         |
| ------ | ------ | ------------------------------------------------------------ |
| 路由(router) | /task  |                                                              |
| 方法(method) | post    |                                                              |
| 参数(body) | --- | 见下方 |

body参数如下
```json
{
	"appleId": "", 
	"bundleId":"", 
	"platform":"android", // Android or iOS
	"appName":""
}
```
---
## 删除一个app(remove one from app list)

| KEY    | VALUE  | DESC                                                         |
| ------ | ------ | ------------------------------------------------------------ |
| 路由(router) | /deltask  |                                                              |
| 方法(method) | post    |                                                              |
| 参数(body) | --- | 见下方 |

body参数如下
```json
{
	"bundleId":"com.test1", 
	"platform":"iOS"
}
```
