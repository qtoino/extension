async function delay(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

async function waitForElement(selector) {
  await delay(100);
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(function () {
      resolve(false);
      observer.disconnect();
    }, 5000);
  });
}

async function clickButton(selector) {
  const button = await waitForElement(selector)
  button?.click()
}

async function fillTextfield(elem, text) {
  let input = elem.tagName ? elem : await waitForElement(elem)
  let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set
  nativeInputValueSetter.call(input, text)
  let event = new Event('input', { bubbles: true })
  input.dispatchEvent(event)
}

async function simulateEvent(selector) {
  var elem = await waitForElement(selector);

  for (var i = 1; i < arguments.length; i++) {
    elem.dispatchEvent(new Event(arguments[i], { bubbles: true }))
  }
}

async function fetchMediaById(fileId) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({
      code: "FETCH_MEDIA",
      fileId: fileId,
    }, async (res) => {
      try {
        const response = await fetch(res.blob)
        const blob = await response.blob()
        const name = res.name
        const file = new File([blob], name, { type: blob.type })

        resolve(file)
      } catch (error) {
        console.error(error)
        resolve(null)
      }
    })

    setTimeout(function () {
      resolve(null)
    }, 5000)
  })
}

async function fetchMediaByUrl(url) {
  try {
    const response = await fetch(url, { referrerPolicy: "no-referrer" })
    const blob = await response.blob()
    const name = blob.type.replace("/", ".")
    const file = new File([blob], name, { type: blob.type })

    return file
  } catch (error) {
    console.error(error)
    return null
  }
}

async function injectFileIntoInput(selector, file) {
  let container = new DataTransfer()
  const input = await waitForElement(selector)
  container.items.add(file)
  input.files = container.files

  await simulateEvent(selector, "change")
}

const stringifyDate = (date) => {
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString("en-US", options)
}

const stringifyDuration = (seconds) => {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}'${sec < 10 ? "0" : ""}${sec}"`
}