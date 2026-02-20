import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateId } from '../lib/utils';
import type { User, UserProfile, CounselingAnswer, DailyRecord } from '../types';

export class FirestoreService {
  
  // ユーザー情報の保存
  async saveUser(lineUserId: string, userData: Partial<User>) {
    try {
      const userRef = doc(db, 'users', lineUserId);
      await setDoc(userRef, {
        ...userData,
        lineUserId,
        updatedAt: serverTimestamp(),
        createdAt: userData.createdAt || serverTimestamp(),
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('ユーザー情報保存エラー:', error);
      throw error;
    }
  }

  // ユーザー情報の取得
  async getUser(lineUserId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', lineUserId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          userId: userSnap.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User;
      }
      
      return null;
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      throw error;
    }
  }

  // カウンセリング結果の保存
  async saveCounselingResult(lineUserId: string, answers: Record<string, any>, aiAnalysis: any) {
    try {
      const counselingRef = doc(db, 'users', lineUserId, 'counseling', 'result');
      
      // 既存のカウンセリング結果を確認
      const existingDoc = await getDoc(counselingRef);
      const existingData = existingDoc.exists() ? existingDoc.data() : null;
      
      // firstCompletedAtを設定（初回のみ）
      const firstCompletedAt = existingData?.firstCompletedAt || serverTimestamp();
      
      await setDoc(counselingRef, {
        answers,
        aiAnalysis,
        completedAt: serverTimestamp(),
        createdAt: existingData?.createdAt || serverTimestamp(),
        firstCompletedAt, // 最初のカウンセリング完了日を保持
      });

      // ユーザープロファイルも更新（undefined値の処理）
      const profile: UserProfile = {
        name: answers.name || 'ユーザー',
        age: Number(answers.age) || 25,
        gender: answers.gender || 'other',
        height: Number(answers.height) || 170,
        weight: Number(answers.weight) || 60,
        activityLevel: answers.activityLevel || 'normal',
        goals: [{
          type: answers.primaryGoal || 'fitness_improve',
          targetValue: Number(answers.targetWeight) || Number(answers.weight) || 60,
        }],
        medicalConditions: answers.medicalConditions || '',
        allergies: answers.allergies || '',
        sleepDuration: answers.sleepDuration || '6_7h',
        sleepQuality: answers.sleepQuality || 'normal',
        exerciseHabit: answers.exerciseHabit || 'no',
        exerciseFrequency: answers.exerciseFrequency || 'none',
        mealFrequency: answers.mealFrequency || '3',
        snackFrequency: answers.snackFrequency || 'sometimes',
        alcoholFrequency: answers.alcoholFrequency || 'none'
      };

      await this.saveUser(lineUserId, { profile });
      
      return true;
    } catch (error) {
      console.error('カウンセリング結果保存エラー:', error);
      throw error;
    }
  }

  // カウンセリング結果の取得
  async getCounselingResult(lineUserId: string) {
    try {
      const counselingRef = doc(db, 'users', lineUserId, 'counseling', 'result');
      const counselingSnap = await getDoc(counselingRef);
      
      if (counselingSnap.exists()) {
        const data = counselingSnap.data();
        return {
          ...data,
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('カウンセリング結果取得エラー:', error);
      throw error;
    }
  }

  // 日次記録の保存
  async saveDailyRecord(lineUserId: string, date: string, recordData: Partial<DailyRecord>) {
    try {
      const recordRef = doc(db, 'users', lineUserId, 'dailyRecords', date);
      await setDoc(recordRef, {
        ...recordData,
        date,
        lineUserId,
        updatedAt: serverTimestamp(),
        createdAt: recordData.createdAt || serverTimestamp(),
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('日次記録保存エラー:', error);
      throw error;
    }
  }

  // 日次記録の取得
  async getDailyRecord(lineUserId: string, date: string): Promise<DailyRecord | null> {
    try {
      const recordRef = doc(db, 'users', lineUserId, 'dailyRecords', date);
      const recordSnap = await getDoc(recordRef);
      
      
      if (recordSnap.exists()) {
        const data = recordSnap.data();
        
        // Migration: Handle both old 'exercise' and new 'exercises' field names
        let exercises = data.exercises;
        if (!exercises && data.exercise) {
          exercises = data.exercise;
          // Update the data to use the new field name
          data.exercises = exercises;
          delete data.exercise;
          
          // Save the migrated data to Firestore to make it permanent
          try {
            await setDoc(recordRef, {
              ...data,
              updatedAt: serverTimestamp()
            });
          } catch (migrationError) {
            console.error('🔄 FirestoreService migration save error:', migrationError);
          }
        }
        
        if (exercises && exercises.length > 0) {
        }
        
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as DailyRecord;
      }
      
      return null;
    } catch (error) {
      console.error('日次記録取得エラー:', error);
      throw error;
    }
  }

  // 期間の記録を取得（レポート用）
  async getDailyRecordsRange(lineUserId: string, startDate: string, endDate: string) {
    try {
      const recordsRef = collection(db, 'users', lineUserId, 'dailyRecords');
      const q = query(
        recordsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
      
      return records;
    } catch (error) {
      console.error('期間記録取得エラー:', error);
      throw error;
    }
  }

  // 食事記録の追加
  async addMeal(lineUserId: string, date: string, mealData: any) {
    try {
      // 既存の日次記録を取得
      const existingRecord = await this.getDailyRecord(lineUserId, date);
      const meals = existingRecord?.meals || [];
      
      // 新しい食事を追加
      meals.push({
        ...mealData,
        id: `meal_${generateId()}`,
        timestamp: new Date(),
      });

      // 日次記録を更新
      await this.saveDailyRecord(lineUserId, date, {
        meals,
      });

      return true;
    } catch (error) {
      console.error('食事記録追加エラー:', error);
      throw error;
    }
  }

  // 運動記録の追加
  async addExercise(lineUserId: string, date: string, exerciseData: any) {
    try {
      
      const existingRecord = await this.getDailyRecord(lineUserId, date);
      
      const exercises = existingRecord?.exercise || [];
      
      const newExercise = {
        ...exerciseData,
        id: `exercise_${generateId()}`,
        timestamp: new Date(),
      };
      
      exercises.push(newExercise);

      const saveData = {
        exercise: exercises,
      };
      
      await this.saveDailyRecord(lineUserId, date, saveData);

      return true;
    } catch (error) {
      console.error('運動記録追加エラー:', error);
      throw error;
    }
  }

  // 体重記録の更新
  async updateWeight(lineUserId: string, date: string, weight: number) {
    try {
      await this.saveDailyRecord(lineUserId, date, {
        weight,
      });

      // ユーザープロファイルの体重も更新
      const user = await this.getUser(lineUserId);
      if (user && user.profile) {
        user.profile.weight = weight;
        await this.saveUser(lineUserId, { profile: user.profile });
      }

      return true;
    } catch (error) {
      console.error('体重記録更新エラー:', error);
      throw error;
    }
  }

  // 食事記録の削除
  async deleteMeal(lineUserId: string, date: string, mealType: string, mealId: string) {
    try {
      // 既存の日次記録を取得
      const existingRecord = await this.getDailyRecord(lineUserId, date);
      if (!existingRecord || !existingRecord.meals) {
        throw new Error('食事記録が見つかりません');
      }

      // 指定されたmealIdの食事を除外
      const updatedMeals = existingRecord.meals.filter((meal: any) => meal.id !== mealId);

      // 日次記録を更新
      await this.saveDailyRecord(lineUserId, date, {
        meals: updatedMeals,
      });

      return true;
    } catch (error) {
      console.error('食事記録削除エラー:', error);
      throw error;
    }
  }

  // プロフィール履歴の保存
  async saveProfileHistory(lineUserId: string, profileData: any) {
    try {
      const changeDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      const profileHistoryRef = doc(db, 'users', lineUserId, 'profileHistory', changeDate);
      
      await setDoc(profileHistoryRef, {
        ...profileData,
        changeDate,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      
      // メインユーザードキュメントの最終更新日も更新
      const userDocRef = doc(db, 'users', lineUserId);
      await updateDoc(userDocRef, {
        lastProfileUpdate: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('プロフィール履歴保存エラー:', error);
      throw error;
    }
  }

  // プロフィール履歴の取得
  async getProfileHistory(lineUserId: string, targetDate?: string): Promise<any> {
    try {
      if (targetDate) {
        // 指定日付の履歴を取得
        const profileHistoryRef = doc(db, 'users', lineUserId, 'profileHistory', targetDate);
        const profileDoc = await getDoc(profileHistoryRef);
        
        if (profileDoc.exists()) {
          return profileDoc.data();
        }
        
        // 指定日付にない場合、その日付以前の最新プロフィールを取得
        const allProfilesRef = collection(db, 'users', lineUserId, 'profileHistory');
        const querySnapshot = await getDocs(allProfilesRef);
        
        const profiles = querySnapshot.docs.map(doc => ({
          id: doc.id,
          changeDate: doc.id, // docのIDが日付
          ...doc.data(),
        }));
        
        // 指定日付以前の履歴のみをフィルタして最新を取得
        const validProfiles = profiles.filter(profile => profile.changeDate <= targetDate);
        
        if (validProfiles.length > 0) {
          const latestValidProfile = validProfiles.sort((a, b) => b.changeDate.localeCompare(a.changeDate))[0];
          return latestValidProfile;
        }
        
        return null;
      }
      
      // 全ての履歴を取得
      const profileHistoryRef = collection(db, 'users', lineUserId, 'profileHistory');
      const querySnapshot = await getDocs(profileHistoryRef);
      
      const profiles = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      return profiles.sort((a, b) => (b as any).changeDate.localeCompare((a as any).changeDate));
    } catch (error) {
      console.error('プロフィール履歴取得エラー:', error);
      throw error;
    }
  }

  // ローカルストレージからの移行（一度だけ実行）
  async migrateFromLocalStorage(lineUserId: string) {
    try {
      // 既存のFirestoreデータをチェック
      const existingUser = await this.getUser(lineUserId);
      if (existingUser) {
        return false;
      }

      // ローカルストレージからデータを取得（クライアントサイドのみ）
      if (typeof window === 'undefined') return false;

      const counselingAnswers = localStorage.getItem('counselingAnswers');
      const aiAnalysis = localStorage.getItem('aiAnalysis');

      if (counselingAnswers) {
        const answers = JSON.parse(counselingAnswers);
        const analysis = aiAnalysis ? JSON.parse(aiAnalysis) : null;

        // カウンセリング結果を保存
        await this.saveCounselingResult(lineUserId, answers, analysis);

        return true;
      }

      return false;
    } catch (error) {
      console.error('移行エラー:', error);
      return false;
    }
  }
}

export default FirestoreService;