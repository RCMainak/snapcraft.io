import "whatwg-fetch";

class BlogPosts {
  constructor(url, holderSelector, templateSelector) {
    if (!url) {
      throw new Error("`url` must be defined");
    }
    if (!holderSelector) {
      throw new Error("`holderSelector` must be defined");
    }
    if (!templateSelector) {
      throw new Error("`templateSelector` must be defined");
    }

    this.url = url;
    this.path = "";
    this.holder = document.querySelector(holderSelector);
    this.template = document.querySelector(templateSelector);

    this.limit = 3;

    if (!this.holder) {
      throw new Error(`${holderSelector} does not exist`);
    }

    if (!this.template) {
      throw new Error(`${templateSelector} does not exist`);
    }
  }

  setResultModifiers(modifiers) {
    this.modifiers = modifiers;
  }

  fetch(callback) {
    const _callback = callback || null;
    return fetch(`${this.url}${this.path}`)
      .then(response => response.json())
      .then(posts => {
        if (posts.length === 0) {
          return false;
        }
        const postsHTML = [];

        if (this.modifiers) {
          this.modifiers.forEach(modifier => {
            posts = modifier(posts);
          });
        }

        const cols = 12 / this.limit;

        posts.forEach((post, index) => {
          if (index >= this.limit) {
            return;
          }
          let postHTML = this.template.innerHTML;
          Object.keys(post).forEach(key => {
            postHTML = postHTML.split("${" + key + "}").join(post[key]);
          });
          const containerClasses = [`col-${cols}`];
          if (post.slug.indexOf("http") === 0) {
            containerClasses.push(`p-blog-post--guest-post`);
          }
          postHTML = postHTML
            .split("${container_class}")
            .join(containerClasses.join(" "));
          postsHTML.push(postHTML);
        });

        if (postsHTML.length > 0) {
          this.holder.innerHTML = postsHTML.join("");
        }

        return posts;
      })
      .then(_callback)
      .catch(error => {
        throw new Error(error);
      });
  }
}

function snapDetailsPosts(
  holderSelector,
  templateSelector,
  showOnSuccessSelector
) {
  const blogPosts = new BlogPosts(
    "/blog/api/snap-posts/",
    holderSelector,
    templateSelector
  );

  const snap = blogPosts.holder.dataset.snap;
  if (!snap) {
    throw new Error("Snap not defined");
  }

  if (blogPosts.holder.dataset.limit) {
    blogPosts.limit = blogPosts.holder.dataset.limit;
  }

  blogPosts.path = snap;

  blogPosts.fetch(function(posts) {
    if (posts.length > 0 && showOnSuccessSelector) {
      const showOnSuccess = document.querySelector(showOnSuccessSelector);
      if (showOnSuccess) {
        showOnSuccess.classList.remove("u-hide");
      }
    }
  });
}

function seriesPosts(holderSelector, templateSelector) {
  const blogPosts = new BlogPosts(
    "/blog/api/series/",
    holderSelector,
    templateSelector
  );

  const series = blogPosts.holder.dataset.series;
  const currentSlug = blogPosts.holder.dataset.currentslug;

  blogPosts.path = series;

  blogPosts.setResultModifiers([
    function reverse(posts) {
      return posts.reverse();
    },
    function filter(posts) {
      return posts.map(post => {
        if (post.slug === currentSlug) {
          post.className = "is-current";
        } else {
          post.className = "";
        }
        return post;
      });
    }
  ]);

  blogPosts.fetch();
}

export { snapDetailsPosts, seriesPosts };
