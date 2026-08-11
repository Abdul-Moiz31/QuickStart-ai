class CustomError extends Error{
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        console.log(`CustomError: message=${message}, statusCode=${statusCode}`);
      }
}
module.exports=CustomError