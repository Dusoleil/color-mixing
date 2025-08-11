import {Color} from "color"
import * as proj from "projections"
import {glMatrix,vec2,vec3,vec4,mat2,mat3,mat4} from "glMatrix"

export function calculate_setpoint(old_sp,old_anchor,new_anchor,old_bary,new_bary,old_anchor_bary,new_anchor_bary)
{
    if(new_bary <= 0) return 0;
    if(old_sp <= 0 || new_anchor <= 0 || old_anchor_bary <= 0 || old_anchor <= 0 || new_anchor_bary <= 0) return new_bary;
    if(old_bary <= 0) return old_sp;
    return (new_anchor*old_sp*old_anchor_bary*new_bary)/(old_anchor*new_anchor_bary*old_bary);
}

export function calculate_setpoints_fixed_sum(old_sp1,old_sp2,fixed_sum,old_bary1,old_bary2,new_bary1,new_bary2)
{
    if(fixed_sum <= 0) return [0,0];
    if(new_bary1 <= 0) return [0,fixed_sum];
    if(new_bary2 <= 0) return [fixed_sum,0];
    if(old_sp1 <= 0 || old_sp2 <= 0) return [new_bary1,new_bary2];
    if(old_bary1 <= 0) return [old_sp1,fixed_sum-old_sp1];
    if(old_bary2 <= 0) return [old_sp2,fixed_sum-old_sp2];
    let lin_eq_left = mat2.fromValues(-1*(old_sp2*old_bary1*new_bary2)/(old_sp1*new_bary1*old_bary2),1,1,1);
    let lin_eq_right = vec2.fromValues(0,fixed_sum);
    let inv_left = mat2.create();
    mat2.invert(inv_left,lin_eq_left);
    let solution = vec2.create();
    vec2.transformMat2(solution,lin_eq_right,inv_left);
    return solution;
}

export function predict_barycentric(old_sp,new_sp,old_bary)
{
    let lin_eq_left = [];
    let lin_eq_right = [];
    for(let j = 0; j < old_bary.length; j++)
    {
        for(let i = 1; i < old_bary.length; i++)
        {
            if(j==0)
                lin_eq_left.push(old_sp[0]*new_sp[i]*old_bary[i]);
            else if(i==j)
            {
                let l = -1*new_sp[0]*old_bary[0]*old_sp[i];
                lin_eq_left.push(l!=0?l:glMatrix.EPSILON);
            }
            else
                lin_eq_left.push(0);
        }
        lin_eq_left.push(1);
    }
    for(let i = 1; i < old_bary.length; i++)
        lin_eq_right.push(0);
    lin_eq_right.push(1);
    if(old_bary.length == 2)
    {
        lin_eq_left = mat2.clone(lin_eq_left);
        lin_eq_right = vec2.clone(lin_eq_right);
        let inv_left = mat2.create();
        mat2.invert(inv_left,lin_eq_left);
        let solution = vec2.create();
        vec2.transformMat2(solution,lin_eq_right,inv_left);
        return solution;
    }
    if(old_bary.length == 3)
    {
        lin_eq_left = mat3.clone(lin_eq_left);
        lin_eq_right = vec3.clone(lin_eq_right);
        let inv_left = mat3.create();
        mat3.invert(inv_left,lin_eq_left);
        let solution = vec3.create();
        vec3.transformMat3(solution,lin_eq_right,inv_left);
        return solution;
    }
    if(old_bary.length == 4)
    {
        lin_eq_left = mat4.clone(lin_eq_left);
        lin_eq_right = vec4.clone(lin_eq_right);
        let inv_left = mat4.create();
        mat4.invert(inv_left,lin_eq_left);
        let solution = vec4.create();
        vec4.transformMat4(solution,lin_eq_right,inv_left);
        return solution;
    }
}

export function predict_color_by_barycentric(current,comp_colors,old_sp,new_sp)
{
    let cur_proj = proj.project_onto_hull(current,comp_colors);
    let cur_bary = proj.barycentric_hull_bounded(current,comp_colors);
    let predict_proj = predict_barycentric(old_sp,new_sp,cur_bary);
    predict_proj = proj.get_composite_from_barycentric(comp_colors,predict_proj);
    let predict = vec3.clone(current);
    let moved_comps = comp_colors.filter((_,i)=>old_sp[i]!=new_sp[i]);
    if(moved_comps.length >= 4 || moved_comps.length == comp_colors.length)
    {
        let move_vec = vec3.create();
        vec3.sub(move_vec,predict_proj,cur_proj);
        vec3.add(predict,predict,move_vec);
    }
    else if(moved_comps.length >= 1)
    {
        let bary = [...moved_comps,cur_proj];
        bary = proj.barycentric_hull(predict_proj,bary);
        for(let c in moved_comps)
        {
            let part = vec3.clone(moved_comps[c]);
            vec3.sub(part,part,current);
            vec3.normalize(part,part);
            let d = proj.point_to_point_distance(cur_proj,moved_comps[c]);
            vec3.scale(part,part,bary[c]*d);
            vec3.add(predict,predict,part);
        }
    }
    predict = Color.from_xyz("Predicted Color",predict);
    return predict;
}
