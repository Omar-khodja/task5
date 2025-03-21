const express = require("express");
const path = require("path");

const app = express();
app.use(express.static(path.resolve(__dirname, "static")));
const PORT = 2000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});