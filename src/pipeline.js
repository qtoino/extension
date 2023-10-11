async function delay(milliseconds) {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
}

class Block {
    constructor() {}
  
    async run() {
      throw new Error('Not implemented');
    }

    async waitForElement(selector) {
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
}

class FillTextBlock extends Block {
    constructor(selector, text) {
        super();
        this.selector = selector;
        this.text = text;
    }

    async run() {
        let input = this.selector.tagName ? this.selector : await this.waitForElement(this.selector);

        if (input) {
            let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            nativeInputValueSetter.call(input, this.text);
            let event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
        } else {
            console.error(`Element with selector "${this.selector}" not found.`);
        }
    }
}

class ClickButtonBlock extends Block {
    constructor(selector) {
        super();
        this.selector = selector;
    }

    async run() {
        const button = await this.waitForElement(this.selector);

        if (button) {
            button.click();
        } else {
            console.error(`Button with selector "${this.selector}" not found.`);
        }
    }
}


export class FillPipeline {
    constructor() {
        this.blocks = [];
    }

    addBlock(block) {
        this.blocks.push(block);
    }

    createPipelineFromJson(json) {
        for (let block of json) {
            switch (block.type) {
                case "fillText":
                    this.addBlock(new FillTextBlock(block.selector, block.text));
                    break;
                case "clickButton":
                    this.addBlock(new ClickButtonBlock(block.selector));
                    break;
                default:
                    console.error(`Unknown block type "${block.type}".`);
            }
        }
    }

    async run() {
        for (let block of this.blocks) {
            await block.run();
        }
    }
}