import express, { Express } from "express";
import { BackendServer } from "./setupServer";
import setupDb from "./setupDb";

class Application {
  public initialize(): void {
    setupDb();
    this.loadConfig();
    const app: Express = express();
    const server: BackendServer = new BackendServer(app);
    server.start();
    Application.handleExit();
  }

  private loadConfig(): void {}

  private static handleExit(): void {
    process.on("uncaughtException", (error: Error) => {
      Application.shutDownProperly(1);
    });

    process.on("unhandleRejection", (reason: Error) => {
      Application.shutDownProperly(2);
    });

    process.on("SIGTERM", () => {
      Application.shutDownProperly(2);
    });

    process.on("SIGINT", () => {
      Application.shutDownProperly(2);
    });

    process.on("exit", () => {
    });
  }

  private static shutDownProperly(exitCode: number): void {
    Promise.resolve()
      .then(() => {
        process.exit(exitCode);
      })
      .catch((error) => {
        process.exit(1);
      });
  }
}

const application: Application = new Application();
application.initialize();
