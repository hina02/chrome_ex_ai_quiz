// ページ解析
function separateChildren(article) {
  const docs = [];
  const children = Array.from(article.children);
  for (let i = 0; i < children.length; i++) {
    const textContent = children[i].textContent || "";

    if (textContent && textContent.length > 1000) {
      const grandChildren = Array.from(children[i].children);
      for (let j = 0; j < grandChildren.length; j++) {
        const grandChild = grandChildren[j];
        const className = grandChild.className || "";
        const parentClass = grandChild.parentElement?.className || "";
        if (grandChild.textContent.trim() == "") continue;
        docs.push({
          url: window.location.href,
          className: className.trim().split(/\s+/).join("."),
          parentClass: parentClass.trim().split(/\s+/).join("."),
          index: j,
          textContent: grandChild.textContent.trim(),
          embedding: [],
        });
      }
    } else if (textContent.trim() != "") {
      docs.push({
        url: window.location.href,
        className: (children[i].className || "").trim().split(/\s+/).join("."),
        parentClass: "article",
        index: i,
        textContent: textContent,
        embedding: [],
      });
    }
  }
  return docs;
}

export { separateChildren };
