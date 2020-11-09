require("dotenv").config();
const debug = require("debug")("elisp");
const { execFile } = require("child_process");
const express = require("express");
const fs = require("fs");
const cors = require("cors");

const host = process.env.HOST || "localhost";
const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.post("/", async (req, res) => {
  const { version, code } = req.body;
  if (!code) {
    res.status(400).json({ error: "Missing code" });
    return;
  }
  if (version && !check_emacs_batch_command(version)) {
    res
      .status(400)
      .json({ error: `Invalid version, supports ${VERSIONS.join(", ")}` });
    return;
  }
  if (!version) {
    version = VERSIONS[0];
  }

  try {
    debug("Input: %o", { code, version });
    const result = await evalEmacsLispCode(code, version);
    debug("Result: %o", result);
    res.json(result);
  } catch (err) {
    // console.error("ERROR\n", err);
    const myError = {};
    Object.assign(myError, err);
    myError.error = err.message;
    res.status(400).json(myError);
  }
});

// From fast to slow
//
// emacs -Q --batch --eval '(pp emacs-version)'
// unshare --fork --pid --mount-proc -w /tmp -S 1001 -G 1001 emacs -Q --batch --eval '(pp emacs-version)'
// podman run --rm --pids-limit 2 --cpus=".5" -m 100m --read-only --network none silex/emacs emacs -Q --batch --eval '(pp emacs-version)'
const EMACS_BATCH_COMMAND = process.env.EMACS_BATCH_COMMAND;

const VERSIONS = ["27.1", "26.3", "25.3", "24.5"];
const check_emacs_batch_command = (emacsVersion) => {
  if (EMACS_BATCH_COMMAND) return true;
  return VERSIONS.includes(emacsVersion);
};
const build_emacs_batch_command = (emacsVersion) => {
  const commandString = EMACS_BATCH_COMMAND
    ? EMACS_BATCH_COMMAND
    : `podman run --rm --read-only --network none silex/emacs:${emacsVersion} emacs -Q --batch --eval`;
  return commandString.split(" ");
};

const evalEmacsLispCode = async (code, version) => {
  const start_time = new Date();
  const prefix = "\n#+RESULTS:\n";
  const wrapper = `(message "${prefix}%s" (pp-to-string (progn ${code})))`;
  const command = build_emacs_batch_command(version).concat(wrapper);
  const options = {
    timeout: 1000 * 10, // 10 seconds
    maxBuffer: 1024 * 100, // 100 KiB
    cwd: "/tmp",
  };
  return new Promise((resolve, reject) => {
    execFile(command[0], command.slice(1), options, (error, stdout, stderr) => {
      const cost_seconds = (new Date() - start_time) / 1000;
      const cost = `${cost_seconds} seconds`;
      if (error) {
        error.cost = cost;
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
      resolve({ cost, value, stdout, stderr });
    });
  });
};

// XXX Test
evalEmacsLispCode("(+ 1 2)", "27.1")
  .then((x) => console.log(x))
  .catch((e) => {
    console.log(`===\n${e.message}\n===`);
    // console.log();
    // console.error(e);
  });

app.listen(port, host, () => {
  console.log(`Listening at http://${host}:${port}`);
});
