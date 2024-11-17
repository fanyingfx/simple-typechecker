const Type = require('./Type')
const TypeEnvironment = require('./TypeEnvironment');
class EvaTC {
    constructor() {
        this.global = this._createGlobal();
    }

    tcGlobal(exp) {
        return this._tcBody(exp, this.global);
    }
    _tcBody(body, env) {
        if (body[0] === 'begin') {
            return this._tcBlock(body, env);
        }
        return this.tc(body, env);
    }
    _tcFunction(params, returnTypeStr, body, env) {
        const returnType = Type.fromString(returnTypeStr);

        const paramsRecord = {};
        const paramTypes = [];

        for (const [name, typeStr] of params) {
            const paramType = Type.fromString(typeStr);
            paramsRecord[name] = paramType;
            paramTypes.push(paramType);
        }

        const fnEnv = new TypeEnvironment(paramsRecord, env);

        const actualReturnType = this._tcBody(body, fnEnv);

        if (!returnType.equals(actualReturnType)) {
            throw `Expected funciton ${body} to return ${returnType}, but got ${actualReturnType}.`
        }

        return new Type.Function({
            paramTypes,
            returnType
        });
    }

    tc(exp, env = this.global) {

        if (this._isNumber(exp)) {
            return Type.number;
        }
        if (this._isString(exp)) {
            return Type.string;
        }
        if (this._isBoolean(exp)) {
            return Type.boolean;
        }
        if (this._isBinary(exp)) {
            return this._binary(exp, env);
        }
        if (this._isBooleanBinary(exp)) {
            return this._booleanBinary(exp, env);
        }

        if (exp[0] === 'var') {
            const [_tag, name, value] = exp;
            const valueType = this.tc(value, env);
            if (Array.isArray(name)) {
                const [varName, typeStr] = name;
                const expectedType = Type.fromString(typeStr);
                this._expect(valueType, expectedType, value, exp);
                return env.define(varName, expectedType);
            }
            return env.define(name, valueType);
        }
        if (this._isVariableName(exp)) {
            return env.lookup(exp);
        }
        if (exp[0] === 'set') {
            const [_, ref, value] = exp;
            const valueType = this.tc(value, env);
            const varType = this.tc(ref, env);
            return this._expect(valueType, varType, value, exp);
        }
        if (exp[0] === 'begin') {
            const blockEnv = new TypeEnvironment({}, env);
            return this._tcBlock(exp, blockEnv);
        }
        if (exp[0] === 'if') {
            const [_tag, condition, consequent, alternate] = exp;

            const t1 = this.tc(condition, env);
            this._expect(t1, Type.boolean, condition, exp);

            const t2 = this.tc(consequent, env);
            const t3 = this.tc(alternate, env);
            return this._expect(t3, t2, exp, exp)

        }
        if (exp[0] === 'while') {
            const [_tag, condition, body] = exp;

            const t1 = this.tc(condition, env);
            this._expect(t1, Type.boolean, condition, exp);
            // console.log('while-body',body);
            return this.tc(body, env);
        }
        if (exp[0] === 'def') {
            // console.log(exp);
            const [_tag, name, params, _retDel, returnTypeStr, body] = exp;
            return env.define(name, this._tcFunction(params, returnTypeStr, body, env));
        }
        // Function call 
        // (square 2)
        if (Array.isArray(exp)) {
            const [fn_exp, ...argValues] = exp;
            const fn = this.tc(fn_exp, env);

            const argTypes = argValues.map(arg => this.tc(arg, env));

            return this._checkFunctionCall(fn, argTypes, env, exp);

        }

        throw `Unknown type of expression ${exp}.`;

    }
    _checkFunctionCall(fn,argTypes,env,exp){
        if(fn.paramTypes.length !== argTypes.length){
            throw `\nFunction ${exp[0]} ${fn.getName()} expects ${fn.paramTypes.length} arguments, ${argTypes.length} given in ${exp}.\n`;
        }

        for (const [index, argType] of argTypes.entries()) {
            this._expect(argType, fn.paramTypes[index], argTypes[index], exp);
        }
        return fn.returnType;
    }
    _tcBlock(block, env) {
        let result;
        const [_tag, ...expressions] = block;
        for (const exp of expressions) {
            result = this.tc(exp, env);
        }


        return result;
    }
    _isVariableName(exp) {
        return typeof exp === 'string' && /^[+\-*/<>=a-zA-Z0-9_:]+$/.test(exp);
    }

    _isNumber(exp) {
        return typeof exp === 'number';
    }
    _isString(exp) {
        return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
    }
    _isBoolean(exp) {
        return typeof exp === 'boolean' || exp === 'true' || exp === 'false';
    }
    _isBinary(exp) {
        switch (exp[0]) {
            case '+':
            case '-':
            case '*':
            case '/':
                return true;
            default:
                return false;
        }
    }
    _binary(exp, env) {
        this._checkArity(exp, 2);
        const t1 = this.tc(exp[1], env);
        const t2 = this.tc(exp[2], env);

        const allowedTypes = this._getOperandTypesForOperator(exp[0]);
        this._expectOperatorType(t1, allowedTypes, exp);
        this._expectOperatorType(t2, allowedTypes, exp);

        return this._expect(t2, t1, exp[2], exp);

    }
    _isBooleanBinary(exp) {
        return (
            exp[0] === '==' ||
            exp[0] === '!=' ||
            exp[0] === '>=' ||
            exp[0] === '<=' ||
            exp[0] === '<' ||
            exp[0] === '>'
        )
    }
    _booleanBinary(exp, env) {
        // console.log("check boolean binary");
        this._checkArity(exp, 2);
        // console.log(exp,exp[1],exp[2]);
        // console.log(typeof exp[1]);
        const t1 = this.tc(exp[1], env);
        const t2 = this.tc(exp[2], env);

        // const allowedTypes = this._getOperandTypesForOperator(exp[0]);
        // this._expectOperatorType(t1, allowedTypes, exp);
        // this._expectOperatorType(t2, allowedTypes, exp);
        // console.log(t2,t1);

        this._expect(t2, t1, exp[2], exp);
        return Type.boolean;

    }


    _getOperandTypesForOperator(operator) {
        switch (operator) {
            case '+':
                return [Type.string, Type.number];
            case '-':
            case '*':
            case '/':
                return [Type.number];
            default:
                throw `Unknown operator: ${operator}.`;

        }
    }
    _expectOperatorType(type_, allowedTypes, exp) {
        if (!allowedTypes.some(t => t.equals(type_))) {
            throw `\nUnexpected type: ${type_} in ${exp}, allowed: ${allowedTypes}`;
        }
    }

    _expect(actualType, expectedType, value, exp) {
        if (!actualType.equals(expectedType)) {
            this._throw(actualType, expectedType, value, exp);
        }
        return actualType;
    }
    _checkArity(exp, arity) {
        if (exp.length - 1 != arity) {
            throw `\nOperator '${exp[0]}' expects ${arity} operands, ${exp.length - 1} given in ${exp}.\n`;
        }
    }

    _throw(actualType, expectedType, value, exp) {
        throw `\nExpected "${expectedType}" type for ${value} in ${exp}, but got "${actualType}" type.\n`;
    }
    _createGlobal() {
        return new TypeEnvironment({
            VERSION: Type.string,
            sum: Type.fromString('Fn<number<number,number>>'),
            square: Type.fromString('Fn<number<number>>'),
        });
    }


}

module.exports = EvaTC;