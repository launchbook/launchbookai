// server/lib/emailTemplates.js

const templates = {
  English: {
    subject: "📘 Your eBook is Ready!",
    html: (title, downloadUrl) => `
      <p>Hello,</p>
      <p>Your eBook titled <b>${title}</b> is ready. Click the button below to download:</p>
      <p><a href="${downloadUrl}" target="_blank">📥 Download Now</a></p>
      <p>Thank you for using LaunchBook AI!</p>
    `
  },
  Hindi: {
    subject: "📘 आपकी ईबुक तैयार है!",
    html: (title, downloadUrl) => `
      <p>नमस्ते,</p>
      <p>आपकी ईबुक <b>${title}</b> तैयार है। नीचे दिए गए बटन पर क्लिक करके डाउनलोड करें:</p>
      <p><a href="${downloadUrl}" target="_blank">📥 अभी डाउनलोड करें</a></p>
      <p>LaunchBook AI का उपयोग करने के लिए धन्यवाद!</p>
    `
  },
  Spanish: {
    subject: "📘 ¡Tu eBook está listo!",
    html: (title, downloadUrl) => `
      <p>Hola,</p>
      <p>Tu eBook titulado <b>${title}</b> está listo. Haz clic en el botón de abajo para descargarlo:</p>
      <p><a href="${downloadUrl}" target="_blank">📥 Descargar ahora</a></p>
      <p>¡Gracias por usar LaunchBook AI!</p>
    `
  },
  French: {
    subject: "📘 Votre eBook est prêt !",
    html: (title, downloadUrl) => `
      <p>Bonjour,</p>
      <p>Votre eBook intitulé <b>${title}</b> est prêt. Cliquez ci-dessous pour le télécharger :</p>
      <p><a href="${downloadUrl}" target="_blank">📥 Télécharger maintenant</a></p>
      <p>Merci d'utiliser LaunchBook AI !</p>
    `
  },
  German: {
    subject: "📘 Dein eBook ist fertig!",
    html: (title, downloadUrl) => `
      <p>Hallo,</p>
      <p>Dein eBook <b>${title}</b> ist bereit. Klicke unten zum Herunterladen:</p>
      <p><a href="${downloadUrl}" target="_blank">📥 Jetzt herunterladen</a></p>
      <p>Danke, dass du LaunchBook AI benutzt!</p>
    `
  },
  Arabic: {
    subject: "📘 كتابك الإلكتروني جاهز!",
    html: (title, downloadUrl) => `
      <p>مرحبًا،</p>
      <p>كتابك الإلكتروني بعنوان <b>${title}</b> جاهز. انقر أدناه لتنزيله:</p>
      <p><a href="${downloadUrl}" target="_blank">📥 تحميل الآن</a></p>
      <p>شكرًا لاستخدامك LaunchBook AI!</p>
    `
  },
  Portuguese: {
    subject: "📘 Seu eBook está pronto!",
    html: (title, downloadUrl) => `
      <p>Olá,</p>
      <p>Seu eBook <b>${title}</b> está pronto. Clique abaixo para fazer o download:</p>
      <p><a href="${downloadUrl}" target="_blank">📥 Baixar agora</a></p>
      <p>Obrigado por usar o LaunchBook AI!</p>
    `
  },
  Indonesian: {
    subject: "📘 eBook Anda Siap!",
    html: (title, downloadUrl) => `
      <p>Halo,</p>
      <p>eBook Anda berjudul <b>${title}</b> sudah siap. Klik tombol di bawah untuk mengunduh:</p>
      <p><a href="${downloadUrl}" target="_blank">📥 Unduh Sekarang</a></p>
      <p>Terima kasih telah menggunakan LaunchBook AI!</p>
    `
  },
  Bengali: {
    subject: "📘 আপনার ইবুক প্রস্তুত!",
    html: (title, downloadUrl) => `
      <p>হ্যালো,</p>
      <p>আপনার ইবুক <b>${title}</b> প্রস্তুত। নিচের বোতামে ক্লিক করে ডাউনলোড করুন:</p>
      <p><a href="${downloadUrl}" target="_blank">📥 এখনই ডাউনলোড করুন</a></p>
      <p>LaunchBook AI ব্যবহার করার জন্য ধন্যবাদ!</p>
    `
  },
  Chinese: {
    subject: "📘 您的电子书已准备好！",
    html: (title, downloadUrl) => `
      <p>你好，</p>
      <p>您的电子书 <b>${title}</b> 已准备好。点击下面的按钮下载：</p>
      <p><a href="${downloadUrl}" target="_blank">📥 立即下载</a></p>
      <p>感谢您使用 LaunchBook AI！</p>
    `
  }
};

function getEmailTemplate(language = 'English') {
  return templates[language] || templates.English;
}

module.exports = { getEmailTemplate };
