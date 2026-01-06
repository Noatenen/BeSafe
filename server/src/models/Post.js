import mongoose from "mongoose";


const UserTagSchema = new mongoose.Schema(
  {
    username: { type: String, default: null },
    full_name: { type: String, default: null },
    is_verified: { type: Boolean, default: null },
    position: { type: mongoose.Schema.Types.Mixed, default: null }, // לפעמים זה אובייקט/מערך
  },
  { _id: false }
);

const PostSchema = new mongoose.Schema(
  {
    platform: { type: String, enum: ["instagram"], required: true },
    username: { type: String, required: true },

    // post fields 
    post_id: { type: String, required: true },
    like_count: { type: Number, default: null },
    comment_count: { type: Number, default: null },
    caption_text: { type: String, default: null },
    accessibility_caption: { type: String, default: null },

    usertags: { type: [UserTagSchema], default: [] },

    fetched_at: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

PostSchema.index({ platform: 1, post_id: 1 }, { unique: true });
PostSchema.index({ platform: 1, username: 1 });

export const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
