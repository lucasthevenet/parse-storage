export type ParserZodEsque<TInput, TParsedInput> = {
  _input: TInput;
  _output: TParsedInput;
};

export type ParserMyZodEsque<TInput> = {
  parse: (input: any) => TInput;
};

export type ParserSuperstructEsque<TInput> = {
  create: (input: unknown) => TInput;
};

export type ParserCustomValidatorEsque<TInput> = (
  input: unknown,
) => TInput;

export type ParserYupEsque<TInput> = {
  validateSync: (input: unknown) => TInput;
};
export type ParserWithoutInput<TInput> =
  | ParserYupEsque<TInput>
  | ParserSuperstructEsque<TInput>
  | ParserCustomValidatorEsque<TInput>
  | ParserMyZodEsque<TInput>;

export type ParserWithInputOutput<TInput, TParsedInput> = ParserZodEsque<
  TInput,
  TParsedInput
>;

export type Parser = ParserWithoutInput<any> | ParserWithInputOutput<any, any>;

export type inferParser<TParser extends Parser> =
  TParser extends ParserWithInputOutput<infer $TIn, infer $TOut>
    ? {
        in: $TIn;
        out: $TOut;
      }
    : TParser extends ParserWithoutInput<infer $InOut>
    ? {
        in: $InOut;
        out: $InOut;
      }
    : never;

export type ParseFn<TType> = (value: unknown) => TType;

export function getParseFn<TType>(procedureParser: Parser): ParseFn<TType> {
  const parser = procedureParser as any;

  if (typeof parser === "function") {
    // ProcedureParserCustomValidatorEsque
    return parser;
  }

  if (typeof parser.parse === "function") {
    // ProcedureParserZodEsque
    return parser.parse.bind(parser);
  }

  if (typeof parser.validateSync === "function") {
    // ProcedureParserYupEsque
    return parser.validateSync.bind(parser);
  }

  if (typeof parser.create === "function") {
    // ProcedureParserSuperstructEsque
    return parser.create.bind(parser);
  }

  throw new Error("Could not find a validator fn");
}
