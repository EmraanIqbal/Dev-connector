const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const User = require("../../modals/Users");
const Profile = require("../../modals/Profile");
const Post = require("../../modals/Posts");

// @route     Post api/posts
// @desc      Create a post
// @Access    Private

router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();

      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route     Get api/posts
// @desc      Get all post
// @Access    private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route     Get api/posts/:id
// @desc      Get post by id
// @Access    private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    console.error(error.message);
    if (error.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route     Delete api/posts/:id
// @desc      Delete post by id
// @Access    private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // check User
    if (post.user.toString() !== req.user.id) {
      res.status(401).json({ msg: "User is authorized" });
    }
    await post.remove();
    res.json({ msg: "Post deleted succesfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route     Put api/posts/likes/:id
// @desc      Like a post
// @Access    private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    console.log(post);

    // check if post has already been liked
    if (
      post.likes.filter((lik) => lik?.user?.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "Post already Liked" });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();

    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route     Put api/posts/unlike/:id
// @desc      Like a post
// @Access    private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // check if post has already been liked
    if (
      post.likes.filter((lik) => lik.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: "Post has not Liked yet" });
    }

    // Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);
    await post.save();

    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route     Post api/posts/comment/:id
// @desc      Adding a comment in a post
// @Access    Private

router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route     DELETE api/posts/comment/:id/:comment_id
// @desc      Deleting comment in a post
// @Access    Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Pull out Comment
    const comment = post.comments.find(
      (comm) => comm.id === req.params.comment_id
    );

    // Make sure that comment is exists
    if (!comment) {
      return res.status(404).json({ msg: "comment has not exist yet" });
    }

    // Check User
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User is not Authorized" });
    }

    // Get remove index
    const removeIndex = post.comments
      .map((comm) => comm.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);
    await post.save();

    res.json(post.comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
