module.exports = {
  rules: {
    "require-ignore-label": {
      meta: {
        type: "problem",
        docs: {
          description:
            'Enforce sentry-label prop with "ignore" prefix on interactive elements',
          category: "Best Practices",
          recommended: true,
        },
        messages: {
          missingSentryLabel:
            '{{ component }} must have a sentry-label prop starting with "ignore" for tracking user interactions in dev tools',
          invalidSentryLabel:
            '{{ component }} sentry-label must start with "ignore" to exclude dev tools interactions from analytics',
        },
        schema: [], // no options
      },
      create(context) {
        // Components that require sentry labels
        const INTERACTIVE_COMPONENTS = new Set([
          // Basic interactive components
          "TouchableOpacity",
          "Button",
          "Pressable",

          // Input components
          "TextInput",
          "Switch",
          "Checkbox",
          "Picker",
          "Select",

          // Custom components
          "LoadingButton",
          "Link",
          "ActionButton",
          "RadioGroup",

          // List components
          "FlatList",
          "VirtualizedList",
          "ScrollView",

          // Modal components
          "Modal",
          "ActionSheet",
          "BottomSheet",

          // Form components
          "TextArea",
          "SearchBar",
          "SegmentedControl",
          "Slider",

          // Menu components
          "Menu",
          "MenuItem",
          "Dropdown",
          "DropdownItem",

          // Navigation components
          "TabBar",
          "TabBarItem",
          "NavigationButton",

          // Gesture components
          "Swipeable",
          "DraggableItem",

          // Media components
          "VideoPlayer",
          "AudioPlayer",
          "ImageViewer",

          // FlashList (Shopify's performance list)
          "FlashList",

          // React Native gesture handler components
          "TapGestureHandler",
          "PanGestureHandler",
          "LongPressGestureHandler",
          "PinchGestureHandler",
          "RotationGestureHandler",
          "FlingGestureHandler",
        ]);

        function checkSentryLabel(node, componentName) {
          // Look for sentry-label prop
          const sentryLabelAttr = node.attributes.find(
            (attr) =>
              attr.type === "JSXAttribute" && attr.name.name === "sentry-label"
          );

          if (!sentryLabelAttr) {
            context.report({
              node,
              messageId: "missingSentryLabel",
              data: {
                component: componentName,
              },
            });
            return;
          }

          // Check if sentry-label value starts with "ignore"
          if (sentryLabelAttr.value) {
            let labelValue = "";

            if (sentryLabelAttr.value.type === "Literal") {
              labelValue = sentryLabelAttr.value.value;
            } else if (
              sentryLabelAttr.value.type === "JSXExpressionContainer" &&
              sentryLabelAttr.value.expression.type === "Literal"
            ) {
              labelValue = sentryLabelAttr.value.expression.value;
            } else if (
              sentryLabelAttr.value.type === "JSXExpressionContainer" &&
              sentryLabelAttr.value.expression.type === "TemplateLiteral"
            ) {
              // Handle template literals - check if first part starts with "ignore"
              const firstQuasi = sentryLabelAttr.value.expression.quasis[0];
              if (firstQuasi && firstQuasi.value.raw) {
                labelValue = firstQuasi.value.raw;
              }
            }

            if (
              typeof labelValue === "string" &&
              !labelValue.toLowerCase().startsWith("ignore")
            ) {
              context.report({
                node,
                messageId: "invalidSentryLabel",
                data: {
                  component: componentName,
                },
              });
            }
          }
        }

        return {
          JSXOpeningElement(node) {
            const componentName = node.name.name;

            // Check if this is an interactive component
            if (INTERACTIVE_COMPONENTS.has(componentName)) {
              checkSentryLabel(node, componentName);
            }

            // Special handling for TextInput to ensure it has both sentry-label and accessibilityLabel
            if (componentName === "TextInput") {
              const hasAccessibilityLabel = node.attributes.some(
                (attr) =>
                  attr.type === "JSXAttribute" &&
                  attr.name.name === "accessibilityLabel"
              );

              // Check sentry-label (will be handled by the main check above)
              // But also ensure accessibilityLabel exists
              if (!hasAccessibilityLabel) {
                context.report({
                  node,
                  messageId: "missingSentryLabel",
                  data: {
                    component: `${componentName} (also missing accessibilityLabel)`,
                  },
                });
              }
            }
          },
        };
      },
    },
  },
};
