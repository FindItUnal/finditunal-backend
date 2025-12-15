import { createApp } from './index';
import UserModel from './models/UserModel';
import ReportModel from './models/ReportModel';
import CategoryModel from './models/CategoryModel';
import LocationModel from './models/LocationModel';
import ObjectModel from './models/ObjectModel';
import ImageModel from './models/ImageModel';
import ComplaintModel from './models/ComplaintModel';
import ConversationModel from './models/ConversationModel';
import MessageModel from './models/MessageModel';
import ActivityLogModel from './models/ActivityLogModel';
import NotificationModel from './models/NotificationModel';

const models = {
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
};

void createApp({
  models,
});
