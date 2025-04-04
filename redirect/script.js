let links = {};

async function loadLinks() {
  try {
    const response = await fetch('links.json');
    if (!response.ok) throw new Error("Failed to load links.json");
    links = await response.json();
  } catch (error) {
    console.error("Error loading link data:", error);
    alert("Unable to load redirect data. Try again later.");
  }
}

function convertToDirectDownload(link) {
  const match = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return link;
}

function redirectToFile() {
  const code = document.getElementById("fileCode").value.trim().toLowerCase();
  if (links[code]) {
    const directLink = convertToDirectDownload(links[code]);
    window.location.href = directLink;
  } else {
    alert("Invalid code. Please try again.");
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  await loadLinks();

  document.getElementById("fileCode").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      redirectToFile();
    }
  });
});
