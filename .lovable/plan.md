

## Plan: End-to-End Testing of All 7 Corrections

This is a browser-based testing plan across 8 steps. I'll navigate the app, interact with each flow, capture screenshots, and check console/network logs at critical points.

### Steps

1. **Auth**: Navigate to `/auth`, create a test account or log in
2. **Diagnostic Force validation**: Fill the Force form step by step, attempt to advance with empty fields to verify disabled button + helper message, then complete it
3. **Diagnostic Mobilité validation**: Same validation check, then complete the form
4. **Dashboard state**: Verify "Générer mon programme" button appears after both diagnostics are done
5. **Program generation**: Generate a program, check the number of training days matches `days_per_week` from the Force form
6. **Session active**: Open today's session, complete exercises with feedback (reps, RPE, pain)
7. **Finish session**: Complete the session, verify it's saved
8. **Regenerate program**: Generate a new program, check edge function logs to confirm session feedback is included in the prompt

### Tools used at each step
- `browser--navigate_to_sandbox`, `browser--act`, `browser--observe`, `browser--screenshot` for UI interaction
- `browser--read_console_logs` and `browser--list_network_requests` for error detection
- `supabase--edge_function_logs` after generation to verify prompt includes session data

### Important notes
- The user needs to be logged in for protected routes. If I hit a login wall, I'll ask the user to authenticate first.
- This is a comprehensive test that will require multiple sequential browser interactions.
- I'll report findings with screenshots at each major step.

