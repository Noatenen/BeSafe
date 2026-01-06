import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    platform: { type: String, enum: ["instagram"], required: true },
    username: { type: String, required: true },

    // what we normalize from API
    full_name: { type: String, default: null },
    is_verified: { type: Boolean, default: null },
    is_private: { type: Boolean, default: null },
    biography: { type: String, default: null },
    external_url: { type: String, default: null },
    profile_pic_url: { type: String, default: null },
    hd_profile_pic_url: { type: String, default: null },

    // user input
    followers_count: { type: Number, default: null },
    following_count: { type: Number, default: null },

    // metrics computed from posts we saved
    metrics: {
      posts_returned_count: { type: Number, default: 0 },
      average_likes: { type: Number, default: 0 },
      average_comments: { type: Number, default: 0 },
      carousel_posts_count: { type: Number, default: 0 },
      unique_tagged_users_count: { type: Number, default: 0 },
    },
    //Scam score
    scoring: {
      score: {type: Number, default: null},
      label: {type: String, default: null},
      reasons: {type: [String], default: []},
      ai_captions: {type: mongoose.Schema.Types.Mixed, default: null},
      scored_at: {type: Date}
    },
    last_fetched_at: { type: Date, default: null },
  },
  { timestamps: true }
);

ProfileSchema.index({ platform: 1, username: 1 }, { unique: true });

export const Profile =
  mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);
