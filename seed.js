// seed-explore.js
const mongoose = require('mongoose');
const Post = require('./models/Post');

const MONGO_URI = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/glammate';

const samplePosts = [
  {
    title: "Chic Summer Set",
    images: [
      "https://i.pinimg.com/1200x/73/d2/c2/73d2c29012fdaab259bb4fb3f76e8bf8.jpg"
    ],
    description: "Light linen matching set.",
    uploadedByName: "GlamKate",
    uploadedByAvatar: "/images/reviewer1.jpg",
    tags: ["summer","linen"]
  },
  {
    title: "Midnight Gown",
    images: [
      "https://i.pinimg.com/1200x/fd/f1/a8/fdf1a81488a31a71d71ded8c5da2405f.jpg"
    ],
    description: "Silk evening gown with minimal jewelry.",
    uploadedByName: "Noor",
    uploadedByAvatar: "/images/reviewer2.jpg",
    tags: ["evening","gown"]
  },
  {
    title: "Street Sport Luxe",
    images: [
      "https://i.pinimg.com/736x/ae/72/da/ae72da6254a002f127121d7bf9722aab.jpg"
    ],
    description: "Chunky sneakers and oversized jacket.",
    uploadedByName: "Aanya",
    uploadedByAvatar: "/images/reviewer3.jpg",
    tags: ["street","casual"]
  },
  {
    title: "Chic Summer Set",
    images: [
      "https://i.pinimg.com/1200x/73/d2/c2/73d2c29012fdaab259bb4fb3f76e8bf8.jpg"
    ],
    description: "Light linen matching set.",
    uploadedByName: "GlamKate",
    uploadedByAvatar: "/images/reviewer1.jpg",
    tags: ["summer","linen"]
  },
  {
    title: "Midnight Gown",
    images: [
      "https://i.pinimg.com/1200x/fd/f1/a8/fdf1a81488a31a71d71ded8c5da2405f.jpg"
    ],
    description: "Silk evening gown with minimal jewelry.",
    uploadedByName: "Noor",
    uploadedByAvatar: "/images/reviewer2.jpg",
    tags: ["evening","gown"]
  },
  {
    title: "Street Sport Luxe",
    images: [
      "https://i.pinimg.com/736x/ae/72/da/ae72da6254a002f127121d7bf9722aab.jpg"
    ],
    description: "Chunky sneakers and oversized jacket.",
    uploadedByName: "Aanya",
    uploadedByAvatar: "/images/reviewer3.jpg",
    tags: ["street","casual"]
  },
  {
    title: "Chic Summer Set",
    images: [
      "https://i.pinimg.com/1200x/73/d2/c2/73d2c29012fdaab259bb4fb3f76e8bf8.jpg"
    ],
    description: "Light linen matching set.",
    uploadedByName: "GlamKate",
    uploadedByAvatar: "/images/reviewer1.jpg",
    tags: ["summer","linen"]
  },
  {
    title: "Midnight Gown",
    images: [
      "https://i.pinimg.com/1200x/fd/f1/a8/fdf1a81488a31a71d71ded8c5da2405f.jpg"
    ],
    description: "Silk evening gown with minimal jewelry.",
    uploadedByName: "Noor",
    uploadedByAvatar: "/images/reviewer2.jpg",
    tags: ["evening","gown"]
  },
  {
    title: "Street Sport Luxe",
    images: [
      "https://i.pinimg.com/736x/ae/72/da/ae72da6254a002f127121d7bf9722aab.jpg"
    ],
    description: "Chunky sneakers and oversized jacket.",
    uploadedByName: "Aanya",
    uploadedByAvatar: "/images/reviewer3.jpg",
    tags: ["street","casual"]
  },
  {
    title: "Chic Summer Set",
    images: [
      "https://i.pinimg.com/1200x/73/d2/c2/73d2c29012fdaab259bb4fb3f76e8bf8.jpg"
    ],
    description: "Light linen matching set.",
    uploadedByName: "GlamKate",
    uploadedByAvatar: "/images/reviewer1.jpg",
    tags: ["summer","linen"]
  },
  {
    title: "Midnight Gown",
    images: [
      "https://i.pinimg.com/1200x/fd/f1/a8/fdf1a81488a31a71d71ded8c5da2405f.jpg"
    ],
    description: "Silk evening gown with minimal jewelry.",
    uploadedByName: "Noor",
    uploadedByAvatar: "/images/reviewer2.jpg",
    tags: ["evening","gown"]
  },
  {
    title: "Street Sport Luxe",
    images: [
      "https://i.pinimg.com/736x/ae/72/da/ae72da6254a002f127121d7bf9722aab.jpg"
    ],
    description: "Chunky sneakers and oversized jacket.",
    uploadedByName: "Aanya",
    uploadedByAvatar: "/images/reviewer3.jpg",
    tags: ["street","casual"]
  },
  {
    title: "Chic Summer Set",
    images: [
      "https://i.pinimg.com/1200x/73/d2/c2/73d2c29012fdaab259bb4fb3f76e8bf8.jpg"
    ],
    description: "Light linen matching set.",
    uploadedByName: "GlamKate",
    uploadedByAvatar: "/images/reviewer1.jpg",
    tags: ["summer","linen"]
  },
  {
    title: "Midnight Gown",
    images: [
      "https://i.pinimg.com/1200x/fd/f1/a8/fdf1a81488a31a71d71ded8c5da2405f.jpg"
    ],
    description: "Silk evening gown with minimal jewelry.",
    uploadedByName: "Noor",
    uploadedByAvatar: "/images/reviewer2.jpg",
    tags: ["evening","gown"]
  },
  {
    title: "Street Sport Luxe",
    images: [
      "https://i.pinimg.com/736x/ae/72/da/ae72da6254a002f127121d7bf9722aab.jpg"
    ],
    description: "Chunky sneakers and oversized jacket.",
    uploadedByName: "Aanya",
    uploadedByAvatar: "/images/reviewer3.jpg",
    tags: ["street","casual"]
  },
  {
    title: "Chic Summer Set",
    images: [
      "https://i.pinimg.com/1200x/73/d2/c2/73d2c29012fdaab259bb4fb3f76e8bf8.jpg"
    ],
    description: "Light linen matching set.",
    uploadedByName: "GlamKate",
    uploadedByAvatar: "/images/reviewer1.jpg",
    tags: ["summer","linen"]
  },
  {
    title: "Midnight Gown",
    images: [
      "https://i.pinimg.com/1200x/fd/f1/a8/fdf1a81488a31a71d71ded8c5da2405f.jpg"
    ],
    description: "Silk evening gown with minimal jewelry.",
    uploadedByName: "Noor",
    uploadedByAvatar: "/images/reviewer2.jpg",
    tags: ["evening","gown"]
  },
  {
    title: "Street Sport Luxe",
    images: [
      "https://i.pinimg.com/736x/ae/72/da/ae72da6254a002f127121d7bf9722aab.jpg"
    ],
    description: "Chunky sneakers and oversized jacket.",
    uploadedByName: "Aanya",
    uploadedByAvatar: "/images/reviewer3.jpg",
    tags: ["street","casual"]
  },
  // Add more posts as needed
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    for (const post of samplePosts) {
      // Check if this sample post already exists
      const exists = await Post.findOne({ title: post.title, uploadedByName: post.uploadedByName });
      if (!exists) {
        await Post.create(post);
        console.log(`Inserted: ${post.title}`);
      } else {
        console.log(`Skipped (already exists): ${post.title}`);
      }
    }

    console.log('Seeding complete!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

seed();
