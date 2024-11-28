const { exec } = require("child_process");
const path = require("path");

const directories = [
  "client",
  "client/auth-app",
  "client/nurse-dashboard-app",
  "client/patient-dashboard-app",
  "client/shell-app",
  "server",
];

const runInstall = async () => {
  for (const dir of directories) {
    console.log(`Installing dependencies in ${dir}...`);
    await new Promise((resolve, reject) => {
      exec("npm install", { cwd: path.resolve(__dirname, dir) }, (err, stdout, stderr) => {
        if (err) {
          console.error(`Error installing in ${dir}:`, stderr);
          reject(err);
        } else {
          console.log(stdout);
          resolve();
        }
      });
    });
  }
  console.log("All dependencies installed successfully!");
};

runInstall().catch((error) => {
  console.error("Installation failed:", error);
});
