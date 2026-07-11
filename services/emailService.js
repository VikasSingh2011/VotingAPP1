const nodemailer = require('nodemailer');

// Ethereal Email (Fake SMTP service for testing)
// In a real production app, you would replace this with SendGrid, AWS SES, or Gmail SMTP
let transporter;

async function initTransporter() {
    if (transporter) return transporter;
    try {
        // Generate a test account dynamically if credentials are not in .env
        const testAccount = await nodemailer.createTestAccount();
        console.log("=========================================");
        console.log("📧 Email Service Initialized (Test Mode)");
        console.log("User: " + testAccount.user);
        console.log("Pass: " + testAccount.pass);
        console.log("=========================================");

        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        return transporter;
    } catch (err) {
        console.error("Failed to initialize email transporter:", err);
    }
}

exports.sendWelcomeEmail = async (email, name, otp) => {
    try {
        const mailer = await initTransporter();
        const otpText = otp ? `\nYour account activation OTP is: ${otp}. It is valid for 5 minutes.\n` : '';
        const otpHTML = otp ? `<p>Your account activation OTP is: <b>${otp}</b>. It is valid for 5 minutes.</p>` : '';
        const info = await mailer.sendMail({
            from: '"Enterprise Voting Admin" <admin@enterprisevoting.local>',
            to: email,
            subject: "Welcome to Enterprise Voting! 🗳️",
            text: `Hello ${name},\n\nWelcome to the Enterprise Voting App! Your account has been created successfully and secured with enterprise-grade encryption.${otpText}\n\nYou are now ready to participate in upcoming elections.\n\nRegards,\nThe Voting Admin Team`,
            html: `<h3>Hello ${name},</h3><p>Welcome to the <b>Enterprise Voting App</b>! Your account has been created successfully and secured with enterprise-grade encryption.</p>${otpHTML}<p>You are now ready to participate in upcoming elections.</p><br><p>Regards,<br>The Voting Admin Team</p>`
        });
        
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.error("Error sending welcome email:", err);
    }
};

exports.sendVoteReceipt = async (email, name, candidateName, electionTitle) => {
    try {
        const mailer = await initTransporter();
        const info = await mailer.sendMail({
            from: '"Enterprise Voting Admin" <admin@enterprisevoting.local>',
            to: email,
            subject: "Vote Cast Receipt 🗳️✅",
            text: `Hello ${name},\n\nThis is an official receipt confirming that your vote for ${candidateName} in the "${electionTitle}" election has been securely recorded on our secure audit log.\n\nThank you for participating!\n\nRegards,\nThe Voting Admin Team`,
            html: `<h3>Hello ${name},</h3><p>This is an official receipt confirming that your vote for <b>${candidateName}</b> in the "<b>${electionTitle}</b>" election has been securely recorded.</p><p>Thank you for participating!</p><br><p>Regards,<br>The Voting Admin Team</p>`
        });
        
        console.log("Receipt sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.error("Error sending vote receipt email:", err);
    }
};

exports.sendElectionStartedNotification = async (email, name, electionTitle) => {
    try {
        const mailer = await initTransporter();
        await mailer.sendMail({
            from: '"Enterprise Voting Admin" <admin@enterprisevoting.local>',
            to: email,
            subject: `Election Started: ${electionTitle} 🗳️`,
            text: `Hello ${name},\n\nThe election "${electionTitle}" has officially started. You can now cast your vote securely on the voting dashboard.\n\nRegards,\nThe Voting Admin Team`,
            html: `<h3>Hello ${name},</h3><p>The election "<b>${electionTitle}</b>" has officially started. You can now cast your vote securely on the voting dashboard.</p><br><p>Regards,<br>The Voting Admin Team</p>`
        });
    } catch (err) {
        console.error("Error sending election started email:", err);
    }
};

exports.sendElectionEndingNotification = async (email, name, electionTitle, hoursLeft) => {
    try {
        const mailer = await initTransporter();
        await mailer.sendMail({
            from: '"Enterprise Voting Admin" <admin@enterprisevoting.local>',
            to: email,
            subject: `Reminder: ${electionTitle} is ending soon! ⏳`,
            text: `Hello ${name},\n\nThis is a reminder that the election "${electionTitle}" is ending in ${hoursLeft} hours. If you haven't voted yet, please cast your vote soon.\n\nRegards,\nThe Voting Admin Team`,
            html: `<h3>Hello ${name},</h3><p>This is a reminder that the election "<b>${electionTitle}</b>" is ending in <b>${hoursLeft} hours</b>. If you haven't voted yet, please cast your vote soon.</p><br><p>Regards,<br>The Voting Admin Team</p>`
        });
    } catch (err) {
        console.error("Error sending election ending email:", err);
    }
};

exports.sendElectionCompletedNotification = async (email, name, electionTitle) => {
    try {
        const mailer = await initTransporter();
        await mailer.sendMail({
            from: '"Enterprise Voting Admin" <admin@enterprisevoting.local>',
            to: email,
            subject: `Election Completed: ${electionTitle} 🏁`,
            text: `Hello ${name},\n\nThe election "${electionTitle}" has completed. The voting portal is now closed.\n\nRegards,\nThe Voting Admin Team`,
            html: `<h3>Hello ${name},</h3><p>The election "<b>${electionTitle}</b>" has completed. The voting portal is now closed.</p><br><p>Regards,<br>The Voting Admin Team</p>`
        });
    } catch (err) {
        console.error("Error sending election completed email:", err);
    }
};

exports.sendResultPublishedNotification = async (email, name, electionTitle, winnerName) => {
    try {
        const mailer = await initTransporter();
        await mailer.sendMail({
            from: '"Enterprise Voting Admin" <admin@enterprisevoting.local>',
            to: email,
            subject: `Results Published: ${electionTitle} 📢`,
            text: `Hello ${name},\n\nThe results for the election "${electionTitle}" have been published. The winner is ${winnerName}.\n\nYou can view the full breakdown of results on your dashboard.\n\nRegards,\nThe Voting Admin Team`,
            html: `<h3>Hello ${name},</h3><p>The results for the election "<b>${electionTitle}</b>" have been published.</p><p>Winner: <b>${winnerName}</b></p><p>You can view the full breakdown of results on your dashboard.</p><br><p>Regards,<br>The Voting Admin Team</p>`
        });
    } catch (err) {
        console.error("Error sending results published email:", err);
    }
};
