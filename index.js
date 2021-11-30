const { parse } = require('csv-parse');
const { createReadStream, createWriteStream } = require('fs');
const { escape } = require('html-escaper');

const records = [];
// Initialize the parser
const parser = parse({
  delimiter: ','
});

let csvData = '';

createReadStream('./subscriptions.csv').on('data', (data) => {
  csvData += data
}).on('end', () => {
  parser.write(csvData.toString());
  // Close the readable stream
  parser.end();
});

const opmlTemplateStart = `<?xml version="1.0" encoding="utf-8"?>
<opml version="1.0">
  <head>
    <dateCreated>Sun, 20 Jun 2021 16:06:53 +0000</dateCreated>
    <title>Tiny Tiny RSS Feed Export</title>
  </head>
  <body>
    <outline text="Youtube Subscriptions Export">`
const opmlTemplateEnd = `
    </outline>
  </body>
</opml>`


// Use the readable stream api to consume records
parser.on('readable', function () {
  let record;
  while ((record = parser.read()) !== null) {
    const [channelId, channelUrl, channelName] = record;
    records.push({
      channelId,
      channelUrl,
      channelName: escape(channelName),
      channelRss: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    });
  }
});
// Catch any error
parser.on('error', function (err) {
  console.error(err.message);
});
// Test that the parsed records matched the expected records
parser.on('end', function () {
  console.log('Reading done')

  const opml = opmlTemplateStart + records.map(({ channelUrl, channelName, channelRss }) => `
    <outline text="${channelName}" type="rss" xmlUrl="${channelRss}" htmlUrl="${channelUrl}"/>`).join('') + opmlTemplateEnd;


  createWriteStream('./subscriptions.opml').write(opml);
});
