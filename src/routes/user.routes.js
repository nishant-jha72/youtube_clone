import { Router } from "express"
import { getCurrentUser, getUserChannelProfile, getWatchHistory, registerUser, updateAccountDetailes, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controllers.js";
import {upload} from '../middlewares/multer.middleware.js';
import {loginUser , logoutUser , refreshAccesToken , changeOldPassword} from  "../controllers/user.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/register").post(
    upload.fields([
        {
            name : 'avatar' ,
            maxCount : 1
        } ,
        {
            name : 'coverImage' ,
            maxCount : 1
        }
    ]) ,
    registerUser)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)

router.route("/refresh-token").post(refreshAccesToken)

router.route("/change-password").post(verifyJWT , changeOldPassword);
 router.route("/get-current-user").get(verifyJWT,getCurrentUser);
 router.route("/update-account-detailes").patch(verifyJWT , updateAccountDetailes);
 router.route("/change-avatar").patch(verifyJWT , upload.single("avatar") , updateUserAvatar)
 router.route("/change-cover-image").patch(verifyJWT , upload.single("coverImage"), updateUserCoverImage)
 router.route("/c/:userName").get(verifyJWT , getUserChannelProfile)
 router.route("/get-watchHistory").get(verifyJWT,getWatchHistory)
export default router;