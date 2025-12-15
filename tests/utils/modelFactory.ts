import UserModel from '../../src/models/UserModel';
import ReportModel from '../../src/models/ReportModel';
import CategoryModel from '../../src/models/CategoryModel';
import LocationModel from '../../src/models/LocationModel';
import ObjectModel from '../../src/models/ObjectModel';
import ImageModel from '../../src/models/ImageModel';
import ComplaintModel from '../../src/models/ComplaintModel';
import ConversationModel from '../../src/models/ConversationModel';
import MessageModel from '../../src/models/MessageModel';
import ActivityLogModel from '../../src/models/ActivityLogModel';
import NotificationModel from '../../src/models/NotificationModel';

export const createRealModels = () => ({
  userModel: new UserModel(),
  reportModel: new ReportModel(),
  categoryModel: new CategoryModel(),
  locationModel: new LocationModel(),
  objectModel: new ObjectModel(),
  imageModel: new ImageModel(),
  complaintModel: new ComplaintModel(),
  conversationModel: new ConversationModel(),
  messageModel: new MessageModel(),
  activityLogModel: new ActivityLogModel(),
  notificationModel: new NotificationModel(),
});
