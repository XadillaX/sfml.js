#pragma once

#include "StringUtilities.h"

namespace Rml {

class TextInputHandler;
class Element;

/**
    Interface for an editable text area.

    Methods of this class are used for the internal IME implementation. Nonetheless, this interface
    provides extra methods that can be used for a custom IME system or any other work with text inputs.

    To capture the context of a text input, create a custom implementation of TextInputHandler.
    See the documentation of the handler for more details.

    The lifetime of RmlUi's implementations is equal to the element's lifetime.

    @see Rml::TextInputHandler
    @see Rml::SetTextInputHandler()
 */
class RMLUICORE_API TextInputContext {
public:
	using LifetimeCallbackForBinding = void (*)(TextInputContext*,
		TextInputHandler*, Element*, bool);
	static LifetimeCallbackForBinding& LifetimeCallbackSlotForBinding()
	{
		static LifetimeCallbackForBinding callback = nullptr;
		return callback;
	}
	static void SetLifetimeCallbackForBinding(LifetimeCallbackForBinding callback)
	{ LifetimeCallbackSlotForBinding() = callback; }
	void NotifyLifetimeForBinding(TextInputHandler* handler,
		Element* element, bool destroyed)
	{
		if (auto callback = LifetimeCallbackSlotForBinding())
			callback(this, handler, element, destroyed);
	}
	using FocusCallbackForBinding = void (*)(TextInputContext*, Element*, bool);
	static FocusCallbackForBinding& FocusCallbackSlotForBinding()
	{
		static FocusCallbackForBinding callback = nullptr;
		return callback;
	}
	static void SetFocusCallbackForBinding(FocusCallbackForBinding callback)
	{ FocusCallbackSlotForBinding() = callback; }
	void NotifyFocusForBinding(Element* element, bool active)
	{
		if (auto callback = FocusCallbackSlotForBinding())
			callback(this, element, active);
	}

	virtual ~TextInputContext() {}

	// sfml.js: read display-line stops at the owning runtime boundary.
	using LayoutCallbackForBinding = void (*)(void*, int, int, float);
	// sfml.js: format dirty text only inside guarded runtime input.
	virtual bool EnsureLayoutForBinding() { return false; }
	virtual uint64_t GetLayoutRevisionForBinding() const { return 0; }
	virtual bool GetLayoutForBinding(void*, LayoutCallbackForBinding)
		const { return false; }
	virtual void SetCursorPositionForBinding(int position, bool)
	{ SetCursorPosition(position); }

	using CaretCallbackForBinding = void (*)(Element*, Vector2f, float);
	static CaretCallbackForBinding& CaretCallbackSlotForBinding()
	{
		static CaretCallbackForBinding callback = nullptr;
		return callback;
	}
	static void SetCaretCallbackForBinding(CaretCallbackForBinding callback)
	{ CaretCallbackSlotForBinding() = callback; }
	static void NotifyCaretForBinding(Element* element, Vector2f caret, float height)
	{
		if (auto callback = CaretCallbackSlotForBinding())
			callback(element, caret, height);
	}

	/// Retrieve the screen-space bounds of the text area (in px).
	/// @param[out] out_rectangle The resulting rectangle covering the projected element's box (in px).
	/// @return True if the bounds can be successfully retrieved, false otherwise.
	virtual bool GetBoundingBox(Rectanglef& out_rectangle) const = 0;

	/// Retrieve the selection range.
	/// @param[out] start The first character selected.
	/// @param[out] end The first character *after* the selection.
	virtual void GetSelectionRange(int& start, int& end) const = 0;

	/// Select the text in the given character range.
	/// @param[in] start The first character to be selected.
	/// @param[in] end The first character *after* the selection.
	virtual void SetSelectionRange(int start, int end) = 0;

	/// Move the cursor caret to after a specific character.
	/// @param[in] position The character position after which the cursor should be moved.
	virtual void SetCursorPosition(int position) = 0;

	/// Replace a text in the given character range.
	/// @param[in] text The string to replace the character range with.
	/// @param[in] start The first character to be replaced.
	/// @param[in] end The first character *after* the range.
	/// @note This method does not respect internal restrictions, such as the maximum length.
	virtual void SetText(StringView text, int start, int end) = 0;

	/// Update the range of the text being composed (for IME).
	/// @param[in] start The first character in the range.
	/// @param[in] end The first character *after* the range.
	virtual void SetCompositionRange(int start, int end) = 0;

	/// Commit an composition string (from IME), and respect internal restrictions (e.g., the maximum length).
	/// @param[in] composition The string to replace the composition range with.
	/// @note If the composition range equals to [0, 0], it takes no action.
	virtual void CommitComposition(StringView composition) = 0;
};

} // namespace Rml
