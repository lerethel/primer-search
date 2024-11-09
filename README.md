This is a simple app that makes PCR primer design a little less tiresome. I only use RT-PCR, so the app is primarily designed for that method.

---

To use the app, download or `git clone` the repository. Then, you have two options:

- Install Node.js 22.7.0 or higher on your computer and run `npm ci` in the project folder to install the dependencies and then `npm start` to start the app
- Install Docker and run `docker build -t primer-search .` in the project folder to create an image and then `docker compose up` to start the app. You don't have to install Node.js in this case

Whichever method you chose, go to `http://localhost:3000` in your browser to open the app.

---

The app queries Ensembl for gene sequences and taxa and Primer-BLAST for primers. It also allows you to easily browse your primers and copy them in a convenient format.

The app caches previous results, so if you need to check something once more, you will get your results instantly. It also caches started Primer-BLAST jobs, so if it is taking too long to find your primers, you can safely close the app and come back to it later. This also means you can run multiple queries one by one and then come back to any of them.

It is recommended to use taxa from the drop-down list rather than typing them out yourself. Type in at least 5 characters for the list to appear. This will reduce the risk of errors and also make caching more reliable since it uses the sequence and taxon as identifiers for your primers.

You can also manually paste a FASTA sequence into the app. It will convert the sequence to a single string and give the exons alternating colors.

The `src` folder also includes a userscript called `CopyFromBlast.userscript.js`, which you can paste into a browser extension like Tampermonkey. The script will create a button on the Primer-BLAST result page with the text "Copy for PrimerSearch." Use it to quickly copy all the primers on the page and then paste them into any primer field in the app. It will recognize the primers and populate the fields with them (**warning:** this will remove all the primers you already had in the fields).
