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
      const value = stderr.slice(
        idx + prefix.length,
        // remove trailing \n added by message
        stderr.length - 1
      );
      stderr = stderr.slice(0, idx);
      resole({ stdout, stderr, value });
    });
  });
};

const getReqBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
};

http
  .createServer(async (req, res) => {
    res.status = (statusCode) => {
      res.statusCode = statusCode;
      return res;
    };
    res.json = (data) => {
      res.setHeader("Content-Type", "application/json; charset=UTF-8");
      res.end(JSON.stringify(data, null, 2) + "\n");
      return res;
    };
    res.error = (message) => {
      res.status(400).json({ error: message });
    };

    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "X-PINGOTHER, Content-Type"
      );
      res.setHeader("Access-Control-Max-Age", "86400");
      res.status(204).end();
      return;
    }

    if (req.method !== "POST") {
      res.error("HTTP method is not POST");
      return;
    }
    const contentType = req.headers["content-type"];
    if (!contentType) {
      res.error("Content-Type is missing");
      return;
    }
    if (!/^application\/json/i.test(contentType)) {
      res.error("Content-Type is not JSON");
      return;
    }

    const reqBody = await getReqBody(req);
    if (!reqBody) {
      res.error(`Empty body, you need POST {"code": "(+ 1 2)"}`);
      return;
    }
    console.log(reqBody);

    let resJson;
    try {
      resJson = JSON.parse(reqBody);
    } catch (err) {
      res.error(`JSON.parse error! ${err.message}`);
      return;
    }
    const code = resJson.code;
    if (!code) {
      res.error(`Missing code, you need POST {"code": "(+ 1 2)"}`);
      return;
    }

    try {
      const result = await evalEmacsLispCode(code);
      res.status(200).json(result);
    } catch (err) {
      // console.error("ERROR\n", err);
      const myError = {};
      Object.assign(myError, err);
      myError.error_message = err.message;
      res.status(400).json(myError);
    }
  })
  .listen(3000, () => {
    console.log("Listening at http://127.0.0.1:3000/");
  });
