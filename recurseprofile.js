#!/usr/bin/env node

const puppeteer = require("puppeteer");
const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const writeFile = util.promisify(fs.writeFile);

let argv = require("yargs")
  .usage("Usage: $0 -u <github username>")
  .alias("u", "username")
  .describe("u", "github username")
  .demandOption(["u"])
  .describe("d", "depth of recursion")
  .alias("d", "depth")
  .default("d", 3)
  .help("h")
  .alias("h", "help").argv;

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

const getScreenshot = async (username, depth) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://github.com/${username}`);
  await page.setViewport({
    width: 1080,
    height: 800,
  });

  await page.screenshot({ path: `screenshot-${depth}.png` });
  await browser.close();
};

(async () => {
  if (argv.username) {
    let d = argv.depth;

    while (d > 0) {
      // Take screenshot
      await getScreenshot(argv.username, d);
      console.log("took screenshot");

      // edit README.md
      await writeFile(
        "README.md",
        `![Woah!](https://github.com/${argv.username}/${argv.username}/blob/main/screenshot-${d}.png)`
      );

      console.log("git add screenshot-" + d + ".png README.md")
      // add to git and push
      try {
        await exec("git add screenshot-" + d + ".png README.md");
        await exec("git commit -m \"adds new screenshot at depth" + d + "\"");
        await exec("git push -u origin main");
      } catch (err) {
        console.error(err);
        console.log("An issue adding files to git occured.");
      }

      console.log("Sleeping 20 seconds while github updates");
      sleep(20000);

      d--;
    }
  }
})();
