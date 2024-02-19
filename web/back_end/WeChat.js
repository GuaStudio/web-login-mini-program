/**
 * Author: Gua <guayun@outlook.com>
 * Function: 呱呱云账号->微信登录->API
 * Version: ES-1.0.0
 **/
const { Client } = require("@notionhq/client");
const { customAlphabet } = require("nanoid");
const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());
const NotionSecret = ""; //Notion的Key
const NotionDataBase = ""; //Notion的数据库ID
const WeChatAppId = ""; //小程序APPID
const WeChatAppSecret = ""; //小程序Secret
const NanoId = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const NotionConnect = new Client({
  auth: NotionSecret,
});
async function getQrCode() {
  try {
  const WeChatScene = NanoId(16);
  const TimeStamp = Date.now();
  const SceneExpireTime = TimeStamp + 5 * 60 * 1000;
  await NotionConnect.request({
    method: "POST",
    path: "pages",
    body: {
      parent: {
        database_id: NotionDataBase,
      },
      properties: {
        Status: {
          status: {
            name: "0",
          },
        },
        Scene: {
          rich_text: [
            {
              text: {
                content: WeChatScene,
              },
            },
          ],
        },
        ExpireTime: {
          number: SceneExpireTime,
        },
      },
    },
  });
  const WeChatGetAccessToken = await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WeChatAppId}&secret=${WeChatAppSecret}`);
  const WeChatAccessToken = WeChatGetAccessToken.data.access_token;
  const WeChatQrCode = await axios({
    headers: {
      "Content-type": "application/json",
    },
    method: "post",
    responseType: "arraybuffer",
    url: `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${WeChatAccessToken}`,
    data: {
      scene: WeChatScene,
      env_version: "trial",
    },
  });
  return `{"status": 200, "msg": "小程序码获取成功", "data": "data:image/png;base64,${WeChatQrCode.data.toString("base64")}", "Scene": "${WeChatScene}"}`;
} catch (error) {
  return `{"status": 500, "msg": "无法获取小程序码"}`;
}
}
async function getStatus(WeChatScene) {
  const getSceneInfo = await NotionConnect.databases.query({
    database_id: NotionDataBase,
    filter: {
      property: "Scene",
      rich_text: {
        contains: WeChatScene,
      },
    },
  });
  const NotionPageStatus = getSceneInfo.results[0].properties.Status.status.name;
  const NotionPageScene = getSceneInfo.results[0].properties.Scene.rich_text[0].text.content;
  return `{"status": 200, "scene": "${NotionPageScene}","scan": "${NotionPageStatus}"}`
}
async function updateStatus(WeChatScene) {
  const getSceneInfo = await NotionConnect.databases.query({
    database_id: NotionDataBase,
    filter: {
      property: "Scene",
      rich_text: {
        contains: WeChatScene,
      },
    },
  });
  const NotionPageId = getSceneInfo.results[0].id;
  const NotionPageStatus = getSceneInfo.results[0].properties.Status.status.name;
  const NotionPageTimeStamp = getSceneInfo.results[0].properties.ExpireTime.number;
  const TimeStamp = Date.now();
  if (NotionPageStatus == 0 && TimeStamp <= NotionPageTimeStamp) {
    const updateSceneInfo = await NotionConnect.pages.update({
      page_id: NotionPageId,
      properties: {
        Status: {
          status: {
            name: "1",
          },
        },
      },
    });
    if (updateSceneInfo.properties.Status.status.name == 1) {
      return `{"status": 200, "msg": "扫码状态更新成功"}`;
    }else{
      return `{"status": 500, "msg": "扫码状态写入失败"}`;
    }
  } else {
    return `{"status": 500, "msg": "小程序码已被使用或已过期"}`;
  }
}
async function updateOpenId(WeChatScene, WeChatCode) {
  const WeChatGetOpenId = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${WeChatAppId}&secret=${WeChatAppSecret}&js_code=${WeChatCode}&grant_type=authorization_code`);
  const WeChatOpenId = WeChatGetOpenId.data.openid;
  if(!WeChatOpenId){
    return `{"status": 500, "msg": "小程序配置错误或CODE错误"}`;
  }
  const getSceneInfo = await NotionConnect.databases.query({
    database_id: NotionDataBase,
    filter: {
      property: "Scene",
      rich_text: {
        contains: WeChatScene,
      },
    },
  });
  const NotionPageId = getSceneInfo.results[0].id;
  const NotionPageStatus = getSceneInfo.results[0].properties.Status.status.name;
  const NotionPageTimeStamp = getSceneInfo.results[0].properties.ExpireTime.number;
  const TimeStamp = Date.now();
  if (NotionPageStatus == 1 && TimeStamp <= NotionPageTimeStamp) {
  const updateSceneInfo = await NotionConnect.pages.update({
    page_id: NotionPageId,
    properties: {
      OpenId: {
        title: [
          {
            text: {
              content: WeChatOpenId,
            },
          },
        ],
      },
      Status: {
        status: {
          name: "2",
        },
      },
    },
  });
  if (updateSceneInfo.properties.Status.status.name == 2) {
    return `{"status": 200, "msg": "登录成功"}`;
  }else{
    return `{"status": 500, "msg": "OPENID写入失败"}`;
  }
} else {
  return `{"status": 500, "msg": "小程序码已被使用或已过期"}`;
}
}
app.get("/api/getQrCode", async (req, res) => {
  const QrCode = await getQrCode();
  res.status(200).send(QrCode);
});
app.get("/api/getStatus", async (req, res) => {
  const Status = await getStatus(req.query.Scene);
  res.status(200).send(Status);
});
app.get("/api/updateStatus", async (req, res) => {
  const Status = await updateStatus(req.query.Scene);
  res.status(200).send(Status);
});
app.get("/api/updateOpenId", async (req, res) => {
  const Status = await updateOpenId(req.query.Scene, req.query.Code);
  res.status(200).send(Status);
});
//module.exports = app;
app.listen(3001, () => {
  console.log(`http://localhost:3001`);
})