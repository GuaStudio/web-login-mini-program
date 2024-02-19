# 一个文件让网站接入小程序登录
## 1.需求
网站如果想要实现微信扫码登录其实有很多种方案，常见的方案就是微信开放平台和微信公众号服务号。前者是目前大部分网站并且是微信认可的一种方式，后者是开发者发现服务号具备扫码关注后即可获取用户基本信息的能力后而开发的一种方式。
而这两者其实都是需要具备资质，例如认证，对于个人开发者来说，是有一定的门槛的，而我这次分享的是0门槛的，个人开发者一样可以实现。

## 2.原理
小程序也是具备获取用户基本信息的能力的，可以调用wx.login接口获取用户的openid实现登录。简单来说就是web端创建一个带参数的二维码同时向数据库插入一条登录记录，此时web端已经开始轮询数据库这条记录的扫码状态了，微信扫码后打开小程序并立即获取到这个参数，然后点击授权登录按钮请求wx.login这个接口获取到openid，然后将openid更新至数据库这个登录记录中并更新扫码状态，web端可以轮询到登录成功的状态码就展示登录成功。

## 3.技术栈
后端:Express (https://www.expressjs.com.cn)
数据库:Notion (https://www.notion.com)

## 4.部署教程
* 1.注册小程序（个人就行）到https://mp.weixin.qq.com注册并填入WeChat.js里
* 2.注册Notion到https://www.notion.com注册即可
* 3.到https://www.notion.so/my-integrations获得Notion的key并填入WeChat.js里
* 4.创建Notion数据库，按照下图创建
<img src="https://jihulab.com/guas/gua/-/raw/main/OpenSource/web-login-mini-program/409a12b5de570cd9c17bfa9aa4c4167.png">
* 5.数据库ID填入WeChat.js里
接下来请开始使用

## 5.接口
* 获取小程序码/api/getQrCode
* 查询扫码状态/api/getStatus
* 更新扫码状态/api/updateStatus?Scene=XXXXXXXXXX
* 写入OPENID /api/updateOpenId?Scene=XXXXXXXXXX&Code=XXXXXXXXXXXXXXXXXXXXXXXX
