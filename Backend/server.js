import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import mongoose from "mongoose";
import { config } from "dotenv";

config();

import signupRoute from "./routes/signup.js";
import signinRoute from "./routes/signin.js";
import deleteUserRoute from "./routes/deleteUser.js";
import verifyRoute from "./routes/verify.js";
import resendRoute from "./routes/resend.js";
import resetPassRoute from "./routes/resetPass.js";
import resetVerifyRoute from "./routes/resetVerify.js";
import resetDoneRoute from "./routes/resetDone.js";
import checkRoute from "./routes/check.js";
import profileRoute from "./routes/profile.js";
import uploadVideoRoute from "./routes/uploadVideo.js";
import uploadImageRoute from "./routes/uploadImage.js";
import videoRoute from "./routes/video.js";
import imageRoute from "./routes/image.js";
import contentRoute from "./routes/content.js";
import interactionsRoute from "./routes/interactions.js";
import updateBioRoute from "./routes/updateBio.js";
import updateAvatarRoute from "./routes/updateAvatar.js";
import updateUsernameRoute from "./routes/updateUsername.js";
import discoverRoute from "./routes/discover.js";
import discoverImagesRoute from "./routes/discoverImages.js";
import deleteContentRoute from "./routes/deleteContent.js";
import searchRoute from "./routes/search.js";
import relatedRoute from "./routes/related.js";
import recommendedRoute from "./routes/recommended.js";
import commentsRoute from "./routes/comments.js";
import reportsRoute from "./routes/reports.js";
import googleAuthRoute from "./routes/googleAuth.js";
import youtubeDownloaderRoute from "./routes/youtubeDown.js";
import youtubeUploadRoute from "./routes/youtubeUpload.js";

const app = new Hono();

app.use("*", cors());

const dbUrl = process.env.DATABASE_URL;
mongoose.connect(dbUrl)
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

const port = process.env.PORT || 3002;

app.get("/", (c) => c.text("Hello World!"));
app.route('/api/signup', signupRoute);
app.route('/api/signup/verify', verifyRoute);
app.route('/api/signup/resend', resendRoute);
app.route('/api/signin', signinRoute);
app.route('/api/google-auth', googleAuthRoute);
app.route('/api/resetpass', resetPassRoute);
app.route('/api/resetpass/verify', resetVerifyRoute);
app.route('/api/deleteuser', deleteUserRoute);
app.route('/api/resetdone', resetDoneRoute);
app.route('/api/check', checkRoute);
app.route('/api/profile', profileRoute);
app.route('/api/uploadVideo', uploadVideoRoute);
app.route('/api/uploadImage', uploadImageRoute);
app.route('/api/video', videoRoute);
app.route('/api/image', imageRoute);
app.route('/api/content', contentRoute);
app.route('/api/interactions', interactionsRoute);
app.route('/api/updateBio', updateBioRoute);
app.route('/api/updateAvatar', updateAvatarRoute);
app.route('/api/updateUsername', updateUsernameRoute);
app.route('/api/discover', discoverRoute);
app.route('/api/discoverImages', discoverImagesRoute);
app.route('/api/delete', deleteContentRoute);
app.route('/api/search', searchRoute);
app.route('/api/related', relatedRoute);
app.route('/api/recommended', recommendedRoute);
app.route('/api/comments', commentsRoute);
app.route('/api/reports', reportsRoute);
app.route('/api/youtube-downloader', youtubeDownloaderRoute);
app.route('/api/youtube-upload', youtubeUploadRoute);
const server = serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);

export { server };
