const app = getApp()
Page({
    data: {
        sceneCode: '',
        scanBtn: true
    },
    onLoad(query) {
        var that = this;
        const scene = decodeURIComponent(query.scene)
        if (scene == 'undefined') {
            that.setData({
                sceneCode: "",
                scanBtn: true
            })
        } else {
            that.setData({
                sceneCode: scene,
                scanBtn: false,
                loginReq: true
            })
        }
        wx.request({
            url: 'https://api.account.ewm.tw/api/updateStatus?Scene=' + that.data.sceneCode,
            data: {},
            header: {
                'content-type': 'application/json'
            },
            success(res){
                if(res.data.status != 200){
                    that.setData({
                        sceneCode: "",
                        scanBtn: false,
                        loginReq: false,
                        statusMsg: res.data.msg
                    })
                }
            }
        })
    },
    loginReq: function () {
        var that = this;
        wx.showLoading({
            title: '登录中，请稍后',
        })
        wx.login({
            success(res) {
                if (res.code) {
                    wx.request({
                        url: 'https://api.account.ewm.tw/api/updateOpenId?Scene=' + that.data.sceneCode + '&Code=' + res.code,
                        data: {},
                        header: {
                            'content-type': 'application/json'
                        },
                        success(res) {
                            if (res.data.status == 200) {
                                wx.showToast({
                                    title: `${res.data.msg}`,
                                    icon: 'success',
                                    duration: 2000
                                })
                            } else {
                                wx.showToast({
                                    title: `${res.data.msg}`,
                                    icon: 'none',
                                    duration: 2000
                                })
                            }
                        }
                    })
                }
            }
        })
    },
    loginCancellation: function () {
        wx.showToast({
            title: '已取消登录',
            icon: 'none',
            duration: 2000
        })
        this.setData({
            status: '已取消登录',
            scanBtn: true
        })
    }
})