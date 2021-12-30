export abstract class CustomError extends Error{
    abstract statusCode: number;

    // Estamos extendiendo de la clase Error, de esta manera, lo que se le pase a super() es lo mismo
    // que le pasariamos a throw new Error('Acá va el mensaje'), este mensaje aparece en los logs al momento
    // en el que un error es lanzado, por esta razón, se exige que se le pase un mensaje: string al super.
    // Esto es implementado por las clases de error que heredan de esta
    constructor(message: string){
        super(message);

        //Only because we are extending a built-in class
        Object.setPrototypeOf(this, CustomError.prototype);
    }

    abstract serializeErrors():{ message:string, field?: string }[]
}