const asyncHandler = require("express-async-handler");
const pool = require("../config/dbConnection")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { response } = require("express");

//@desc Register a user
//@route POST /api/users/register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("one or more fields are missing !");
  }
  const { rowCount } = await pool.query("SELECT * FROM users where email =$1", [email]);
  if (rowCount > 0) {
    res.status(400);
    throw new Error("User already exists !");
  }

  //Hashing password and creating new user 
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hashed Password: ", hashedPassword);
  const { rows } = await pool.query(
    "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING username, email"
    , [username, email, hashedPassword]);

  console.log(rows);
  if (rows.length > 0) {
    res.status(201).json({ username: rows[0].username, email: rows[0].email });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
  res.json({ message: "Register the user" });
});

//@desc Login user
//@route POST /api/users/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory!");
  }
  const { rowCount, rows } = await pool.query("SELECT * FROM users where email =$1", [email]);
  //compare password with hashedpassword
  if (rowCount && (await bcrypt.compare(password, rows[0].password))) {
    const accessToken = jwt.sign(
      {
        user: {
          username: rows[0].username,
          email: rows[0].email,
          id: rows[0].id,
        },
      },
      process.env.ACCESS_TOKEN_SECERT,
      { expiresIn: "105m" }
    );
    res.status(200).json({ accessToken });
  } else {
    res.status(401);
    throw new Error("email or password is not valid");
  }
});

//@desc Current user info
//@route POST /api/users/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const follow = asyncHandler(async (req, res) => {
  const followId = req.params.id;
  const userId = req.user.id;
  // Insert a new row into the followers table
  console.log('**************')
  console.log(userId,followId)
  pool.query(
    'INSERT INTO followers (user_id, follower_id) VALUES ($1, $2)',
    [followId, userId],
    (err) => {
      if (err) {
        console.error('Error following user', err);
        res.status(500).send('Error following user');
      } else {
        res.status(200).send('User followed successfully');
      }
    }
  );
});

const unfollow = asyncHandler(async (req, res) => {
  const unfollowId = req.params.id;
  const userId = req.user.id;

  // Delete the row from the followers table
  pool.query(
    'DELETE FROM followers WHERE user_id = $1 AND follower_id = $2',
    [unfollowId, userId],
    (err) => {
      if (err) {
        console.error('Error unfollowing user', err);
        res.status(500).send('Error unfollowing user');
      } else {
        res.status(200).send('User unfollowed successfully');
      }
    }
  );
})

const addPosts = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.id; // Get the authenticated user's ID

  // Insert the new post into the posts table
  pool.query(
    'INSERT INTO posts (title, description, created_by) VALUES ($1, $2, $3) RETURNING id, title, description, created_at',
    [title, description, userId],
    (err, result) => {
      if (err) {
        console.error('Error adding new post', err);
        res.status(500).send('Error adding new post');
      } else {
        const { id, title, description, created_at } = result.rows[0];
        res.status(200).json({ id, title, description, created_at });
      }
    }
  );
})
const deletePost = asyncHandler(async (req, res) => {
  const postId  = req.params.id;
  const userId = req.user.id;
  client.query(
    'SELECT * FROM posts WHERE id = $1 AND created_by = $2',
    [postId, userId],
    (err, result) => {
      if (err) {
        console.error('Error checking post ownership', err);
        res.status(500).send('Error checking post ownership');
      } else if (result.rowCount === 0) {
        // If the post doesn't exist or wasn't created by the authenticated user, return a 404 Not Found response
        res.status(404).send('Post not found');
      } else {
        // If the post exists and was created by the authenticated user, delete it from the posts table
        client.query(
          'DELETE FROM posts WHERE id = $1',
          [postId],
          (err, result) => {
            if (err) {
              console.error('Error deleting post', err);
              res.status(500).send('Error deleting post');
            } else {
              res.status(200).send('Post deleted successfully');
            }
          }
        );
      }
    }
  );
})
const getAllPosts = asyncHandler(async (req, res) => {
  const userId = req.user.id; // assuming you have middleware to authenticate user and set req.user

  try {
    // Get all posts created by the authenticated user sorted by post time
    const { rows } = await pool.query(
      'SELECT * FROM posts WHERE created_by = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
})
const getPost = asyncHandler(async (req, res) => {
  const postId = req.params.id;

  try {
    // Get the post with the specified id
    const { rows } = await pool.query(
      'SELECT * FROM posts WHERE id = $1',
      [postId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = rows[0];

    // Get the number of likes for the post
    const { rows: likeRows } = await pool.query(
      'SELECT COUNT(*) FROM likes WHERE post_id = $1',
      [postId]
    );
    const numLikes = likeRows[0].count;

    // Get the number of comments for the post
    const { rows: commentRows } = await pool.query(
      'SELECT COUNT(*) FROM comments WHERE post_id = $1',
      [postId]
    );
    const numComments = commentRows[0].count;

    // Add the number of likes and comments to the post object
    const postWithStats = {
      ...post,
      num_likes: numLikes,
      num_comments: numComments,
    };

    res.status(200).json(postWithStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
})

const likePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id; // assuming req.user contains the authenticated user's id

  try {
    // Check if the post exists
    const { rows: postRows } = await pool.query(
      'SELECT * FROM posts WHERE id = $1',
      [postId]
    );
    if (postRows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user already liked the post
    const { rows: likeRows } = await pool.query(
      'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    if (likeRows.length > 0) {
      return res.status(400).json({ message: 'Post already liked' });
    }

    // Add the like to the database
    const { rows: newLikeRows } = await pool.query(
      'INSERT INTO likes (post_id, user_id) VALUES ($1, $2) RETURNING *',
      [postId, userId]
    );

    const newLike = newLikeRows[0];

    res.status(201).json({
      id: newLike.id,
      post_id: newLike.post_id,
      user_id: newLike.user_id,
      created_at: newLike.created_at,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
})

const unlikePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id; // assuming req.user contains the authenticated user's id

  try {
    // Check if the post exists
    const { rows: postRows } = await pool.query(
      'SELECT * FROM posts WHERE id = $1',
      [postId]
    );
    if (postRows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user already liked the post
    const { rows: likeRows } = await pool.query(
      'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    if (likeRows.length === 0) {
      return res.status(400).json({ message: 'Post not liked yet' });
    }

    // Remove the like from the database
    await pool.query(
      'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    res.status(200).json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
})
const comment = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id; // assuming req.user contains the authenticated user's id
  const { comment } = req.body;

  try {
    // Check if the post exists
    const { rows: postRows } = await pool.query(
      'SELECT * FROM posts WHERE id = $1',
      [postId]
    );
    if (postRows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add the comment to the database
    const { rows: newCommentRows } = await pool.query(
      'INSERT INTO comments (post_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
      [postId, userId, comment]
    );

    const newComment = newCommentRows[0];

    res.status(201).json({
      id: newComment.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
})
module.exports = {
  registerUser,
  loginUser,
  currentUser,
  follow,
  unfollow,
  addPosts,
  deletePost,
  getAllPosts,
  getPost,
  likePost,
  unlikePost,
  comment

};