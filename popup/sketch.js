
function setup() {
  noCanvas();

  // Trigger funny face at the beginning
  let queryOptions = { active: true, currentWindow: true };
  chrome.tabs.query(queryOptions).then(tabs =>{
    chrome.tabs.sendMessage(tabs[0].id, {});
    window.close();
  });
}
