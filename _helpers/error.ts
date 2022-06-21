export class AutoBackRouteError extends Error {
    code: number;

    constructor(code: number, message: string, name: string = "AutoBackRouteError") {
        super(message);
        this.code = code;
        this.name = name;
    }
}