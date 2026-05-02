import { memo } from "react";
import { timeAgo } from "../utils.js";
import Skeleton from "../../../components/Skeleton.jsx";

const PostList = memo(function PostList({ posts, syncing }) {
  if (syncing) {
    return (
      <div>
        <div className="section-title">Fetching posts...</div>
        <Skeleton variant="text" count={8} />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="fb-empty">
        <p>No posts yet</p>
        <p>Add some feeds, then hit "Fetch Posts" to load recent posts.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-title">Latest Posts ({posts.length})</div>
      <div className="post-list">
        {posts.map((p) => (
          <div key={p.postId} className="post-item">
            <div className="post-content">
              {p.content.length > 200 ? p.content.slice(0, 200) + "..." : p.content}
            </div>
            <div className="post-meta">
              <span className="post-source">{p.pageName}</span>
              <span className="post-time">{timeAgo(p.publishedAt)}</span>
              {p.link && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="post-link"
                >
                  View Post
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default PostList;
