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

createApp({
  models: {
    userModel: UserModel,
    reportModel: ReportModel,
    categoryModel: CategoryModel,
    locationModel: LocationModel,
    objectModel: ObjectModel,
    imageModel: ImageModel,
    complaintModel: ComplaintModel,
    conversationModel: ConversationModel,
    messageModel: MessageModel,
  },
});
