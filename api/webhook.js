// api/webhook.js
require('dotenv').config();
const nodemailer = require('nodemailer');
const emailService = process.env.EMAIL_SERVICE || 'qq';

// 配置 Nodemailer 邮件服务
const transporter = nodemailer.createTransport({
    service: emailService, // 使用环境变量指定的邮件服务，默认是 'qq'
    auth: {
        user: process.env.EMAIL_USER, // 从环境变量中读取邮箱地址
        pass: process.env.EMAIL_PASS, // 从环境变量中读取邮箱密码
    },
});

export default function handler(req, res) {
    // 从 URL 查询参数中获取 'toEmail', 'fromName' 和 'subject'
    const toEmail = req.query.toEmail;
    const fromName = req.query.fromName;
    const subject = req.query.subject;

    // 如果没有提供 'toEmail', 'fromName' 或 'subject'，返回错误响应
    if (!toEmail || !fromName || !subject) {
        return res.status(400).json({error: 'Missing toEmail, fromName, or subject query parameter'});
    }

    const contentType = req.headers['content-type'];
    let message = '';
    // 根据 Content-Type 解析请求体
    if (contentType && contentType.includes('json')) {
        // 解析 JSON 格式
        message = JSON.stringify(req.body, null, 2);
    } else {
        // 对于其他类型（例如纯文本）
        message = req.body || 'No message content available'; // 如果是纯文本
    }

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
}

