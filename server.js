const http = require("http");
const { execFile } = require("child_process");

const EMACS_BINARY = "/usr/local/bin/emacs";
const CODE = `(message "The time is %s" (current-time-string))`;

const evalEmacsLispCode = async (code) => {
  const prefix = "\n#+RESULTS:\n";
  const wrapper = `(message "${prefix}%S" ${code})`;
  const args = ["-Q", "--batch", "--eval", wrapper];
  const options = {
    timeout: 1000 * 10, // 10 seconds
    maxBuffer: 1024 * 100, // 100 KiB
  };
  return new Promise((resole, reject) => {
    execFile(EMACS_BINARY, args, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      const idx = stderr.lastIndexOf(prefix);
      const value = stderr.slice(idx + prefix.length);
      stderr = stderr.slice(0, idx);
      resole({ stdout, stderr, value });
    });
  });
};

http
  .createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=UTF-8");
    let data = null;
    try {
      data = await evalEmacsLispCode(CODE);
    } catch (err) {
      // console.error("ERROR\n", err);
      data = {};
      Object.assign(data, err);
      data.error_message = err.message;
      res.statusCode = 400;
    }
    res.end(JSON.stringify(data, null, 2) + "\n");
  })
  .listen(3000, () => {
    console.log("Listening at http://127.0.0.1:3000/");
  });
