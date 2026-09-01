import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Branch } from "@/types/auth";

interface BranchState {
  currentBranchId: string | null;
  accessibleBranches: Branch[];
}

const initialState: BranchState = {
  currentBranchId: null,
  accessibleBranches: [],
};

const branchSlice = createSlice({
  name: "branch",
  initialState,
  reducers: {
    setBranches: (
      state,
      action: PayloadAction<{ defaultBranch: Branch; accessibleBranches: Branch[] }>
    ) => {
      state.currentBranchId = action.payload.defaultBranch.id;
      state.accessibleBranches = action.payload.accessibleBranches;
    },
    switchBranch: (state, action: PayloadAction<string>) => {
      const branchExists = state.accessibleBranches.some(
        (branch) => branch.id === action.payload
      );
      if (branchExists) {
        state.currentBranchId = action.payload;
      }
    },
    updateBranchDetails: (state, action: PayloadAction<Branch>) => {
      const index = state.accessibleBranches.findIndex(
        (branch) => branch.id === action.payload.id,
      );
      if (index >= 0) {
        state.accessibleBranches[index] = action.payload;
      }
    },
    clearBranches: (state) => {
      state.currentBranchId = null;
      state.accessibleBranches = [];
    },
  },
});

export const { setBranches, switchBranch, updateBranchDetails, clearBranches } = branchSlice.actions;
export default branchSlice.reducer;
