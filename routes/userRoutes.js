const express = require("express");
const {
  registerUser,
  currentUser,
  loginUser,
  follow,
  unfollow,
  addPosts,
  deletePost,
  getAllPosts,
  getPost,
  likePost,
  unlikePost,
  comment,
} = require("../controllers/Controller");
const validateToken = require("../middleware/validateTokenHandler");

const router = express.Router();

router.post("/register", registerUser);

router.post("/authenticate", loginUser);

router.get("/user", validateToken, currentUser);

router.post("/follow/:id", validateToken, follow);

router.post("/unfollow/:id", validateToken, unfollow);

router.post("/posts", validateToken, addPosts);

router.delete("/posts/:id", validateToken, deletePost);

router.get("/posts/:id", validateToken, getPost);

router.get("/all_posts", validateToken, getAllPosts);

router.get("/like/:id", validateToken, likePost);

router.get("/unlike/:id", validateToken, unlikePost);

router.get("/comment/:id", validateToken, comment);





module.exports = router;
