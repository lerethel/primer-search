This is a simple app that makes primer design a little less tiresome. I only use RT-PCR, so the app is primarily designed for that method. Run it with `npm start` (Node.js 22.7.0 or higher is required) and go to `http://localhost:3000` in your browser.

The app queries Ensembl for gene sequences and taxa and Primer-BLAST for primers. It also allows you to easily browse your primers and copy them in a convenient format.

The app caches previous results, so if you need to check something once more, you'll get your results instantly. It also caches started Primer-BLAST jobs, so if BLAST is taking too long to find your primers, you can safely close the app and come back to it later.

It is recommended to use taxa from the drop-down list rather than typing them out yourself. Type in at least 5 characters for the list to appear. This will reduce the risk of errors and also make caching more reliable since it uses the sequence and taxon as identifiers for your primers.

You can also manually copy a FASTA sequence into the app. It will convert it to a single string with exons having alternating colors.

The `src` folder also includes a userscript called `CopyFromBlast.userscript.js`, which you can copy into a browser extension like Tampermonkey. The script will create a button on the Primer-BLAST result page with the text "Copy for PrimerSearch." Use it to quickly copy all the primers on the page and then paste them into any primer field in the app. It will recognize the primers and populate the fields with them (warning: this will remove all the primers you already had in the fields).
