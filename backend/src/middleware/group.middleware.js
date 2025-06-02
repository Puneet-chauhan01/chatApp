import Group from "../models/group.model.js";

export const isGroupMember = async (req, res, next) => {
  const groupId = req.params.id;
  const userId = req.user._id;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.includes(userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Access denied: not a group member" });
    }

    next();
  } catch (error) {
    console.error("Error in group membership middleware", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
