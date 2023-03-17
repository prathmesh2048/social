CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  followers INT NOT NULL DEFAULT 0,
  followings INT NOT NULL DEFAULT 0
);


CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id),
  user_id INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id),
  user_id INT NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE followers (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    follower_id INT NOT NULL REFERENCES users(id)
);
