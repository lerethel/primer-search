import path from "path";

export const getIndex = (req, res) =>
  res.sendFile(
    path.join(import.meta.dirname, "..", "..", "client", "index.html")
  );
