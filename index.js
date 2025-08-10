require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

// 创建 Express 应用
const app = express();
const port = process.env.PORT || 3000;

// 解析 JSON 请求体
app.use(express.json());

// 设置静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 默认使用 QQ 邮箱，如果环境变量中没有指定其他邮件服务
const emailService = process.env.EMAIL_SERVICE || 'qq';

// 配置 Nodemailer 邮件服务
const transporter = nodemailer.createTransport({
    service: emailService, // 使用环境变量指定的邮件服务，默认是 'qq'
    auth: {
        user: process.env.EMAIL_USER, // 从环境变量中读取邮箱地址
        pass: process.env.EMAIL_PASS, // 从环境变量中读取邮箱密码
    },
});

// Webhook 端点
app.post('/webhook', (req, res) => {
    // 从 URL 查询参数中获取 'toEmail', 'fromName' 和 'subject'
    const toEmail = req.query.toEmail;
    const fromName = req.query.fromName;
    const subject = req.query.subject;

    // 如果没有提供 'toEmail', 'fromName' 或 'subject'，返回错误响应
    if (!toEmail || !fromName || !subject) {
        return res.status(400).json({error: 'Missing toEmail, fromName, or subject query parameter'});
    }

    // 获取请求体中的 message
    const {message} = req.body;

    // 邮件内容
    const mailOptions = {
        from: `"${fromName}" <${process.env.EMAIL_USER}>`, // 发件人名称从 URL 中获取
        to: toEmail, // 收件人邮箱从 URL 中获取
        subject: subject, // 邮件主题从 URL 中获取
        text: message || 'This is a default webhook message.' // 邮件内容从请求体中获取
    };

    // 发送邮件
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({error: 'Failed to send email', details: error});
        }
        res.status(200).json({message: 'Email sent successfully', info});
    });
});

// 路由：显示生成 Webhook URL 的页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(port, () => {
    console.log(`Webhook server is running on port ${port}`);
});
