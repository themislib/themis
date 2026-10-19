import { calleeIdentifierName, staticString } from "../../ast-utils.mjs";
import { createArchitectureRule, createArchitectureRulePlugin } from "../../rule-utils.mjs";

export const ruleId = "no-manual-async-lifecycle-action";

const lifecycleWords = new Set(["requested", "started", "pending", "completed", "succeeded", "success", "fulfilled", "failed", "failure", "rejected"]);
const wordSegment = /[A-Z]+(?=[A-Z][a-z]|$)|[A-Z]?[a-z]+|[0-9]+/g;
const createActionFactoryFile = /(?:^|\/)utils\/store\/create-action\.[cm]?[jt]sx?$/;

function isLifecycleSuffix(value) {
  if (typeof value !== "string") return false;
  const finalSegment = value.split(/[^a-z0-9]+/i).at(-1);
  const finalWord = finalSegment?.match(wordSegment)?.at(-1)?.toLowerCase();
  return lifecycleWords.has(finalWord);
}

function declaredCreatorName(node) {
  const declaration = node.parent;
  return declaration?.type === "VariableDeclarator" && declaration.init === node && declaration.id?.type === "Identifier"
    ? declaration.id.name
    : undefined;
}

export const rule = createArchitectureRule({
  ruleId,
  summary: "Manual createAction declaration models an async lifecycle stage.",
  why: "Parallel request/success/failure action creators split one promise-bearing workflow across unrelated declarations.",
  fix: "Replace the lifecycle createAction declaration with one createAsyncAction and use its request-bound or static stages. For a reviewed domain-event or compatibility exception, add a narrow rule-specific ESLint disable with its reason.",
  create(_context, { classifyPath, report }) {
    return {
      CallExpression(node) {
        if (calleeIdentifierName(node) !== "createAction" || createActionFactoryFile.test(classifyPath().path)) return;

        const creatorName = declaredCreatorName(node);
        const actionType = staticString(node.arguments[0]);
        const actionSegment = actionType?.split("/").at(-1);
        if (!isLifecycleSuffix(creatorName) && !isLifecycleSuffix(actionSegment)) return;

        report({
          node: isLifecycleSuffix(creatorName) ? node.parent.id : node.arguments[0],
          summary: "Manual createAction lifecycle stages should be replaced with one createAsyncAction.",
        });
      },
    };
  },
});

export const plugin = createArchitectureRulePlugin(ruleId, rule);
export default plugin;